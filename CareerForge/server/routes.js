import validator from "validator";
import crypto from "crypto";
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
  AIServiceError,
} from "./geminiService.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
});

const ROLES = ["Frontend Developer", "Backend Developer", "Full Stack Developer", "Software Engineer", "Java Developer", "MERN Developer"];
const COMPANIES = ["Amazon", "Google", "TCS", "Infosys", "Wipro", "Accenture", "Cognizant"];
const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const LANGUAGES = ["English"];
const FEEDBACK_MODES = ["Detailed", "Concise"];
const TEXT_LIMIT = 120000;
const ANSWER_LIMIT = 20000;

function requiredString(value, field, maxLength = 200) {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    const error = new Error(`${field} is invalid.`);
    error.statusCode = 400;
    throw error;
  }
  return value.trim();
}

function optionalString(value, field, maxLength = 200) {
  if (value === undefined || value === null || value === "") {return undefined;}
  return requiredString(value, field, maxLength);
}

function validateQuestions(questions) {
  if (
    !Array.isArray(questions) || questions.length !== 5 || questions.some((question) =>
      !question || typeof question.id !== "string" || typeof question.question !== "string" ||
      !question.question.trim() || question.question.length > 2000 || typeof question.category !== "string" ||
      !Array.isArray(question.expectedKeywords) || question.expectedKeywords.length === 0 ||
      question.expectedKeywords.some((keyword) => typeof keyword !== "string" || keyword.length > 200)
    ) || new Set(questions.map((question) => question.id)).size !== questions.length
  ) {
    const error = new Error("Interview questions are invalid.");
    error.statusCode = 400;
    throw error;
  }
}

function validateAnswers(answers, questions) {
  if (
    !Array.isArray(answers) || answers.length !== questions.length || answers.some((answer) =>
      !answer || typeof answer.questionId !== "string" || typeof answer.userAnswer !== "string" ||
      answer.userAnswer.length > ANSWER_LIMIT
    )
  ) {
    const error = new Error("Interview answers are invalid.");
    error.statusCode = 400;
    throw error;
  }
}

function sendRouteError(res, err, fallbackMessage) {
  if (err instanceof AIServiceError || err?.code === "AI_SERVICE_FAILURE") {
    return res.status(503).json({ error: "AI service is temporarily unavailable. Please try again later." });
  }
  const status = Number.isInteger(err?.statusCode) ? err.statusCode : 500;
  return res.status(status).json({ error: status < 500 ? err.message : fallbackMessage });
}

function hasPdfSignature(buffer) {
  return Buffer.isBuffer(buffer) && buffer.subarray(0, 5).toString("ascii") === "%PDF-";
}

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  try {
    const name = requiredString(req.body.name, "Name", 100);
    const email = requiredString(req.body.email, "Email", 254).toLowerCase();
    const password = requiredString(req.body.password, "Password", 128);
    if (!validator.isEmail(email)) {return res.status(400).json({ error: "Please provide a valid email address." });}
    if (password.length < 8) {return res.status(400).json({ error: "Password must be at least 8 characters long." });}

    const existingUser = findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: "Email address is already in use." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = {
      id: "u_" + crypto.randomUUID(),
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
    const email = requiredString(req.body.email, "Email", 254).toLowerCase();
    const password = requiredString(req.body.password, "Password", 128);
    if (!validator.isEmail(email)) {return res.status(400).json({ error: "Please provide a valid email address." });}

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
      const targetRole = optionalString(req.body.role, "Role", 100) || "Software Engineer";
      if (!ROLES.includes(targetRole)) {return res.status(400).json({ error: "Role selection is invalid." });}

      // Check if file is provided
      if (req.file) {
        if (req.file.mimetype !== "application/pdf" || !hasPdfSignature(req.file.buffer)) {
          return res.status(400).json({ error: "Only PDF resumes are accepted." });
        }

        try {
          // Parse loaded buffer with the modern PDFParse class
          const parser = new PDFParse({ data: req.file.buffer });
          const parsedData = await parser.getText();
          resumeText = (parsedData.text || "").trim();
          
          // Limit extracted text to TEXT_LIMIT
          if (resumeText.length > TEXT_LIMIT) {
            resumeText = resumeText.substring(0, TEXT_LIMIT);
          }
        } catch (pdfErr) {
          console.error("PDF Parsing failed", pdfErr?.message || pdfErr);
          return res.status(400).json({ error: "Unable to parse resume PDF. Please ensure it is not corrupt or copy and paste resume text." });
        }
      } else if (req.body.resumeText) {
        // Fallback or explicit pasted resume text
        resumeText = requiredString(req.body.resumeText, "Resume text", TEXT_LIMIT);
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
      if (err instanceof AIServiceError || err?.code === "AI_SERVICE_FAILURE") {
        return res.status(503).json({ error: "Resume analysis service is temporarily unavailable. Please try again later." });
      }
      console.error("Resume Processing error", err);
      return sendRouteError(res, err, "Unable to process the resume.");
    }
  }
);

// POST /api/interview/generate-questions (Protected)
router.post("/interview/generate-questions", authMiddleware, async (req, res) => {
  try {
    const role = requiredString(req.body.role, "Role", 100);
    const resumeText = requiredString(req.body.resumeText, "Resume text", TEXT_LIMIT);
    const companyName = optionalString(req.body.companyName, "Company name", 100);
    if (!ROLES.includes(role) || (companyName && !COMPANIES.includes(companyName))) {
      return res.status(400).json({ error: "Interview selection is invalid." });
    }

    const questions = await generateSessionQuestions(resumeText, role, companyName);
    
    // Validate that we got valid questions before returning
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(503).json({ error: "Unable to generate valid interview questions. Please try again." });
    }

    return res.json({
      role,
      companyName: companyName || null,
      questions,
    });
  } catch (err) {
    console.error("Generate questions error", err);
    return sendRouteError(res, err, "Unable to create interview questions.");
  }
});

// POST /api/interview/submit (Protected)
router.post("/interview/submit", authMiddleware, async (req, res) => {
  try {
    const { role, companyName, resumeText, questions, answers } = req.body;
    const normalizedRole = requiredString(role, "Role", 100);
    const normalizedResumeText = requiredString(resumeText, "Resume text", TEXT_LIMIT);
    const normalizedCompanyName = optionalString(companyName, "Company name", 100);
    if (!ROLES.includes(normalizedRole) || (normalizedCompanyName && !COMPANIES.includes(normalizedCompanyName))) {
      return res.status(400).json({ error: "Interview selection is invalid." });
    }
    validateQuestions(questions);
    validateAnswers(answers, questions);

    // 1. Analyze and score the answers
    const evaluation = await evaluateInterviewAnswers(normalizedRole, questions, answers);

    // 2. Add extra ATS score tracking into evaluation from resume matching if desired
    const combinedAtsAnalysis = await analyzeResume(normalizedResumeText, normalizedRole);
    evaluation.atsReport = {
      score: combinedAtsAnalysis.atsScore || 70,
      missingKeywords: combinedAtsAnalysis.missingKeywords || [],
      suggestions: combinedAtsAnalysis.resumeSuggestions || [],
    };

    // 3. Generate Learning Roadmaps based on candidate weak topics
    const roadmap = await generatePrepRoadmaps(evaluation.weakAreas);

    // 4. Save entire object to historical database
    const newInterview = {
      id: "int_" + crypto.randomUUID(),
      userId: req.userId || "",
      role: normalizedRole,
      companyName: normalizedCompanyName,
      resumeText: normalizedResumeText,
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
    return sendRouteError(res, err, "Unable to evaluate the interview.");
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

    // Validate and set name
    if (name !== undefined) {
      const validatedName = optionalString(name, "Name", 100);
      if (validatedName) {
        updates.name = validatedName;
      } else if (typeof name === "string" && name.trim().length > 0) {
        return res.status(400).json({ error: "Name is invalid or too long." });
      }
    }
    
    // Validate and set email
    if (email !== undefined && email.toLowerCase() !== user.email.toLowerCase()) {
      const validatedEmail = optionalString(email, "Email", 254);
      if (validatedEmail) {
        if (!validator.isEmail(validatedEmail)) {
          return res.status(400).json({ error: "Please provide a valid email address." });
        }
        const existingUser = findUserByEmail(validatedEmail);
        if (existingUser && existingUser.id !== user.id) {
          return res.status(400).json({ error: "Email address is already in use by another account." });
        }
        updates.email = validatedEmail;
      }
    }

    // Validate and set theme (must be "light" or "dark")
    if (theme !== undefined && typeof theme === "string" && ["light", "dark"].includes(theme)) {
      updates.theme = theme;
    }

    // Validate and set profileImage (optional string)
    if (profileImage !== undefined && typeof profileImage === "string") {
      if (profileImage.length <= 2000) {
        updates.profileImage = profileImage;
      }
    }

    // Validate and set preferredRole
    if (preferredRole !== undefined && ROLES.includes(preferredRole)) {
      updates.preferredRole = preferredRole;
    }

    // Validate and set preferredDifficulty
    if (preferredDifficulty !== undefined && DIFFICULTIES.includes(preferredDifficulty)) {
      updates.preferredDifficulty = preferredDifficulty;
    }

    // Validate and set preferredQuestionCount (1-10)
    if (preferredQuestionCount !== undefined) {
      const parsedCount = Number(preferredQuestionCount);
      if (Number.isInteger(parsedCount) && parsedCount >= 1 && parsedCount <= 10) {
        updates.preferredQuestionCount = parsedCount;
      } else {
        return res.status(400).json({ error: "Question count must be between 1 and 10." });
      }
    }

    // Validate and set preferredLanguage
    if (preferredLanguage !== undefined && LANGUAGES.includes(preferredLanguage)) {
      updates.preferredLanguage = preferredLanguage;
    }

    // Validate and set feedbackMode
    if (feedbackMode !== undefined && FEEDBACK_MODES.includes(feedbackMode)) {
      updates.feedbackMode = feedbackMode;
    }

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

    if (newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters long." });
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

    if (!resumeText || typeof resumeText !== "string" || !resumeText.trim()) {
      return res.status(400).json({ error: "Candidate resume text is required for comparison." });
    }

    if (!jobDescription || typeof jobDescription !== "string" || !jobDescription.trim()) {
      return res.status(400).json({ error: "Job description is required for comparison." });
    }

    // Validate sizes
    if (resumeText.length > TEXT_LIMIT) {
      return res.status(400).json({ error: "Resume text is too long. Please provide a shorter resume." });
    }

    if (jobDescription.length > TEXT_LIMIT) {
      return res.status(400).json({ error: "Job description is too long. Please provide a shorter job description." });
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
    return sendRouteError(res, err, "An error occurred while analyzing compatibility.");
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

    try {
      const parser = new PDFParse({ data: req.file.buffer });
      const parsedData = await parser.getText();
      let extractedText = (parsedData.text || "").trim();
      
      // Limit extracted text
      if (extractedText.length > TEXT_LIMIT) {
        extractedText = extractedText.substring(0, TEXT_LIMIT);
      }

      if (!extractedText) {
        return res.status(400).json({ error: "Unable to extract text from the PDF. Please copy and paste the Job Description text instead." });
      }

      return res.json({ text: extractedText });
    } catch (pdfErr) {
      console.error("PDF extraction failed:", pdfErr?.message || pdfErr);
      return res.status(400).json({ error: "Unable to extract text from the PDF. Please copy and paste the Job Description text instead." });
    }
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
