import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { PDFParse } from "pdf-parse";
import { JWT_SECRET, authMiddleware } from "./authMiddleware.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
  getInterviewsByUserId,
  getInterviewById,
  saveInterview,
  updateInterview,
  updateUser,
  getJobMatchAnalysesByUserId,
  saveJobMatchAnalysis,
} from "./db.js";
import {
  analyzeResume,
  generateSessionQuestions,
  evaluateInterviewAnswers,
  generatePrepRoadmaps,
  compareResumeToJobDescription,
} from "./geminiService.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
});

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Please provide all required fields." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters long." });
    }

    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email address is already in use." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = {
      id: "u_" + Math.random().toString(36).substring(2, 11),
      name,
      email,
      passwordHash,
      createdAt: new Date().toISOString(),
      theme: "dark",
      profileImage: "",
      preferredRole: "Software Engineer",
      preferredDifficulty: "Medium",
      preferredQuestionCount: 5,
      preferredLanguage: "English",
      feedbackMode: "Detailed",
      jwtVersion: 1,
    };

    createUser(newUser);

    const token = jwt.sign({ userId: newUser.id, email: newUser.email, jwtVersion: 1 }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        theme: newUser.theme,
        profileImage: newUser.profileImage,
        preferredRole: newUser.preferredRole,
        preferredDifficulty: newUser.preferredDifficulty,
        preferredQuestionCount: newUser.preferredQuestionCount,
        preferredLanguage: newUser.preferredLanguage,
        feedbackMode: newUser.feedbackMode,
      },
    });
  } catch (err) {
    console.error("Register Error:", err);
    return res.status(500).json({ error: "Internal server error occurred during registration." });
  }
});

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Please enter both email and password." });
    }

    const user = findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ error: "Invalid login credentials." });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid login credentials." });
    }

    const currentJwtVersion = user.jwtVersion || 1;
    if (!user.jwtVersion) {
      // populate if not present
      const dbUser = findUserById(user.id);
      if (dbUser) {
        dbUser.jwtVersion = 1;
        updateUser(user.id, { jwtVersion: 1 });
      }
    }

    const token = jwt.sign({ userId: user.id, email: user.email, jwtVersion: currentJwtVersion }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        theme: user.theme || "dark",
        profileImage: user.profileImage || "",
        preferredRole: user.preferredRole || "Software Engineer",
        preferredDifficulty: user.preferredDifficulty || "Medium",
        preferredQuestionCount: user.preferredQuestionCount || 5,
        preferredLanguage: user.preferredLanguage || "English",
        feedbackMode: user.feedbackMode || "Detailed",
      },
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ error: "Internal server error occurred during login." });
  }
});

// GET /api/auth/me (Protected)
router.get("/auth/me", authMiddleware, (req, res) => {
  try {
    const user = findUserById(req.userId || "");
    if (!user) {
      return res.status(404).json({ error: "User session not found." });
    }
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      theme: user.theme || "dark",
      profileImage: user.profileImage || "",
      preferredRole: user.preferredRole || "Software Engineer",
      preferredDifficulty: user.preferredDifficulty || "Medium",
      preferredQuestionCount: user.preferredQuestionCount || 5,
      preferredLanguage: user.preferredLanguage || "English",
      feedbackMode: user.feedbackMode || "Detailed",
    });
  } catch (err) {
    return res.status(500).json({ error: "Session verification failed." });
  }
});

// ==========================================
// 2. INTERVIEW SIMULATOR ENDPOINTS
// ==========================================

// POST /api/interview/upload-resume (Protected)
router.post(
  "/interview/upload-resume",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      let resumeText = "";
      const targetRole = (req.body.role || "Software Engineer").trim();

      // Check if file is provided
      if (req.file) {
        if (req.file.mimetype !== "application/pdf") {
          return res.status(400).json({ error: "Only PDF resumes are accepted." });
        }

        try {
          // Parse loaded buffer with the modern PDFParse class
          const parser = new PDFParse({ data: req.file.buffer });
          const parsedData = await parser.getText();
          resumeText = parsedData.text || "";
        } catch (pdfErr) {
          console.error("PDF Parsing failed", pdfErr);
          return res.status(400).json({ error: "Unable to parse resume PDF. Please ensure it is not corrupt or copy and paste resume text." });
        }
      } else if (req.body.resumeText) {
        // Fallback or explicit pasted resume text
        resumeText = req.body.resumeText.trim();
      }

      if (!resumeText || resumeText.length < 50) {
        return res.status(400).json({
          error: "Resume text content is empty or too short. Please upload a valid PDF or paste your resume content.",
        });
      }

      // Analyze resume (skills breakdown and ATS scoring metrics)
      const analysis = await analyzeResume(resumeText, targetRole);

      return res.json({
        resumeText,
        analysis,
      });
    } catch (err) {
      console.error("Resume Processing error", err);
      return res.status(500).json({ error: "Internal error parsing resume." });
    }
  }
);

// POST /api/interview/generate-questions (Protected)
router.post("/interview/generate-questions", authMiddleware, async (req, res) => {
  try {
    const { role, resumeText, companyName } = req.body;

    if (!role || !resumeText) {
      return res.status(400).json({ error: "Missing required role selection or parsed resume content." });
    }

    const questions = await generateSessionQuestions(resumeText, role, companyName);

    return res.json({
      role,
      companyName: companyName || null,
      questions,
    });
  } catch (err) {
    console.error("Generate questions error", err);
    return res.status(500).json({ error: "Internal error creating questions." });
  }
});

// POST /api/interview/submit (Protected)
router.post("/interview/submit", authMiddleware, async (req, res) => {
  try {
    const { role, companyName, resumeText, questions, answers } = req.body;

    if (!role || !questions || !answers || !resumeText) {
      return res.status(400).json({ error: "Incomplete details for evaluation submission." });
    }

    // 1. Analyze and score the answers
    const evaluation = await evaluateInterviewAnswers(role, questions, answers);

    // 2. Add extra ATS score tracking into evaluation from resume matching if desired
    const combinedAtsAnalysis = await analyzeResume(resumeText, role);
    evaluation.atsReport = {
      score: combinedAtsAnalysis.atsScore || 70,
      missingKeywords: combinedAtsAnalysis.missingKeywords || [],
      suggestions: combinedAtsAnalysis.resumeSuggestions || [],
    };

    // 3. Generate Learning Roadmaps based on candidate weak topics
    const roadmap = await generatePrepRoadmaps(evaluation.weakAreas);

    // 4. Save entire object to historical database
    const newInterview = {
      id: "int_" + Math.random().toString(36).substring(2, 11),
      userId: req.userId || "",
      role,
      companyName: companyName || undefined,
      resumeText,
      generatedQuestions: questions,
      answers,
      evaluation,
      roadmap,
      createdAt: new Date().toISOString(),
    };

    saveInterview(newInterview);

    return res.status(201).json(newInterview);
  } catch (err) {
    console.error("Submit evaluation error", err);
    return res.status(500).json({ error: "Internal error evaluating answers." });
  }
});

// GET /api/interview/history (Protected)
router.get("/interview/history", authMiddleware, (req, res) => {
  try {
    const userId = req.userId || "";
    const history = getInterviewsByUserId(userId);
    return res.json(history);
  } catch (err) {
    console.error("History loading error", err);
    return res.status(500).json({ error: "Internal error fetching history list." });
  }
});

// GET /api/interview/:id (Protected)
router.get("/interview/:id", authMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const interview = getInterviewById(id);

    if (!interview) {
      return res.status(404).json({ error: "Session record not found." });
    }

    // Ensure users cannot view other users' records
    if (interview.userId !== req.userId) {
      return res.status(403).json({ error: "Access denied to third-party logs." });
    }

    return res.json(interview);
  } catch (err) {
    console.error("Single session load error", err);
    return res.status(500).json({ error: "Internal error loading single session." });
  }
});

// ==========================================
// 3. SETTINGS & PROFILE ENDPOINTS
// ==========================================

// GET /api/settings (Protected)
router.get("/settings", authMiddleware, (req, res) => {
  try {
    const user = findUserById(req.userId || "");
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      theme: user.theme || "dark",
      profileImage: user.profileImage || "",
      preferredRole: user.preferredRole || "Software Engineer",
      preferredDifficulty: user.preferredDifficulty || "Medium",
      preferredQuestionCount: user.preferredQuestionCount || 5,
      preferredLanguage: user.preferredLanguage || "English",
      feedbackMode: user.feedbackMode || "Detailed",
    });
  } catch (err) {
    console.error("Get settings error", err);
    return res.status(500).json({ error: "Internal error loading settings." });
  }
});

// PUT /api/settings (Protected)
router.put("/settings", authMiddleware, async (req, res) => {
  try {
    const {
      name,
      email,
      theme,
      profileImage,
      preferredRole,
      preferredDifficulty,
      preferredQuestionCount,
      preferredLanguage,
      feedbackMode,
    } = req.body;

    const user = findUserById(req.userId || "");
    if (!user) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const updates = {};

    if (name !== undefined) updates.name = name;
    
    if (email !== undefined && email.toLowerCase() !== user.email.toLowerCase()) {
      const existingUser = findUserByEmail(email);
      if (existingUser && existingUser.id !== user.id) {
        return res.status(400).json({ error: "Email address is already in use by another account." });
      }
      updates.email = email;
    }

    if (theme !== undefined) updates.theme = theme;
    if (profileImage !== undefined) updates.profileImage = profileImage;
    if (preferredRole !== undefined) updates.preferredRole = preferredRole;
    if (preferredDifficulty !== undefined) updates.preferredDifficulty = preferredDifficulty;
    if (preferredQuestionCount !== undefined) updates.preferredQuestionCount = Number(preferredQuestionCount);
    if (preferredLanguage !== undefined) updates.preferredLanguage = preferredLanguage;
    if (feedbackMode !== undefined) updates.feedbackMode = feedbackMode;

    const updatedUser = updateUser(user.id, updates);

    if (!updatedUser) {
      return res.status(500).json({ error: "Could not persist user update." });
    }

    return res.json({
      success: true,
      message: "Settings updated successfully.",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        theme: updatedUser.theme || "dark",
        profileImage: updatedUser.profileImage || "",
        preferredRole: updatedUser.preferredRole || "Software Engineer",
        preferredDifficulty: updatedUser.preferredDifficulty || "Medium",
        preferredQuestionCount: updatedUser.preferredQuestionCount || 5,
        preferredLanguage: updatedUser.preferredLanguage || "English",
        feedbackMode: updatedUser.feedbackMode || "Detailed",
      }
    });

  } catch (err) {
    console.error("Update settings error", err);
    return res.status(500).json({ error: "Internal error updating settings." });
  }
});

// PUT /api/settings/password (Protected)
router.put("/settings/password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Both current and new passwords are required." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long." });
    }

    const user = findUserById(req.userId || "");
    if (!user) {
      return res.status(404).json({ error: "User session not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect current password." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Also update jwtVersion to automatically log out other devices on password change if desired
    const nextVersion = (user.jwtVersion || 1) + 1;

    updateUser(user.id, { 
      passwordHash,
      jwtVersion: nextVersion 
    });

    return res.json({
      success: true,
      message: "Password changed successfully! You will need to log in again on other devices.",
      nextJwtVersion: nextVersion
    });

  } catch (err) {
    console.error("Password update error", err);
    return res.status(500).json({ error: "Internal error changing password." });
  }
});

// POST /api/settings/logout-all (Protected)
router.post("/settings/logout-all", authMiddleware, (req, res) => {
  try {
    const user = findUserById(req.userId || "");
    if (!user) {
      return res.status(404).json({ error: "User session not found." });
    }

    const nextVersion = (user.jwtVersion || 1) + 1;
    updateUser(user.id, { jwtVersion: nextVersion });

    return res.json({
      success: true,
      message: "Successfully invalidated all sessions. Other devices will be logged out dynamically.",
      nextJwtVersion: nextVersion
    });

  } catch (err) {
    console.error("Logout-all error", err);
    return res.status(500).json({ error: "Internal error resetting session tokens." });
  }
});

// ==========================================
// 6. RESUME VS JOB DESCRIPTION MATCH ENDPOINTS
// ==========================================

// POST /api/jd-match/analyze (Protected)
router.post("/jd-match/analyze", authMiddleware, async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || !resumeText.trim()) {
      return res.status(400).json({ error: "Candidate resume text is required for comparison." });
    }

    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({ error: "Job description is required for comparison." });
    }

    // Call Gemini API to match resume and Job Description text contents
    const analysisResult = await compareResumeToJobDescription(resumeText, jobDescription);

    const newAnalysis = {
      id: "jm_" + Math.random().toString(36).substring(2, 11),
      userId: req.userId,
      resumeText,
      jobDescription,
      matchScore: analysisResult.matchScore ?? 0,
      matchedSkills: analysisResult.matchedSkills ?? [],
      missingSkills: analysisResult.missingSkills ?? [],
      keywordAnalysis: analysisResult.keywordAnalysis ?? { foundKeywords: [], missingKeywords: [], atsCriticalKeywords: [] },
      strengths: analysisResult.strengths ?? "",
      risks: analysisResult.risks ?? [],
      recommendations: analysisResult.recommendations ?? [],
      interviewProbability: analysisResult.interviewProbability ?? { score: "Medium Chance", confidence: 50 },
      learningRoadmap: analysisResult.learningRoadmap ?? { plan7Days: [], plan14Days: [], plan30Days: [] },
      resumeOptimization: analysisResult.resumeOptimization ?? { missingKeywords: [], bulletPointSuggestions: [], projectSuggestions: [], atsImprovements: [] },
      advancedAnalysis: analysisResult.advancedAnalysis ?? { technicalSkillMatch: 0, experienceMatch: 0, keywordMatch: 0, projectRelevanceMatch: 0 },
      createdAt: new Date().toISOString(),
    };

    saveJobMatchAnalysis(newAnalysis);

    return res.status(201).json(newAnalysis);
  } catch (err) {
    console.error("Error in POST /api/jd-match/analyze", err);
    return res.status(500).json({ error: "An error occurred while analyzing compatibility." });
  }
});

// POST /api/jd-match/upload-jd (Protected)
router.post("/jd-match/upload-jd", authMiddleware, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No Job Description file uploaded." });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Only PDF format job descriptions are accepted." });
    }

    const parser = new PDFParse({ data: req.file.buffer });
    const parsedData = await parser.getText();
    const extractedText = parsedData.text || "";

    if (!extractedText.trim()) {
      return res.status(400).json({ error: "Unable to extract text from the PDF. Please copy and paste the Job Description text instead." });
    }

    return res.json({ text: extractedText });
  } catch (err) {
    console.error("Error in POST /api/jd-match/upload-jd", err);
    return res.status(500).json({ error: "Failed to extract text from Job Description PDF." });
  }
});

// GET /api/jd-match/history (Protected)
router.get("/jd-match/history", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const history = getJobMatchAnalysesByUserId(userId);
    return res.json(history);
  } catch (err) {
    console.error("Error in GET /api/jd-match/history", err);
    return res.status(500).json({ error: "Failed to retrieve job match history." });
  }
});

export default router;
