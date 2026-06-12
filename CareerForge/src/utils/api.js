const API_BASE = "/api";

function getHeaders() {
  const token = localStorage.getItem("ai_interview_token");
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Authentication
  async login(email, passwordString) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: passwordString }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Login request failed");
    }
    return data; // { token, user: { id, name, email } }
  },

  async register(name, email, passwordString) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password: passwordString }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Registration failed");
    }
    return data; // { token, user: { id, name, email } }
  },

  async getMe() {
    const token = localStorage.getItem("ai_interview_token");
    if (!token) return null;

    const res = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      headers: getHeaders(),
    });
    if (!res.ok) {
      localStorage.removeItem("ai_interview_token");
      return null;
    }
    return await res.json(); // { id, name, email }
  },

  // Upload/Process Resume
  async uploadResume(file, pastedText, role) {
    const token = localStorage.getItem("ai_interview_token");
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let res;
    if (file) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("role", role || "Software Engineer");
      
      res = await fetch(`${API_BASE}/interview/upload-resume`, {
        method: "POST",
        headers,
        body: formData,
      });
    } else {
      res = await fetch(`${API_BASE}/interview/upload-resume`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ resumeText: pastedText, role: role || "Software Engineer" }),
      });
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Resume analysis failed");
    }
    return data; // { resumeText, analysis: { skills, technologies, projects, strengths, weakAreas, atsScore, missingKeywords, resumeSuggestions } }
  },

  // Generate Questions
  async generateQuestions(role, resumeText, companyName) {
    const res = await fetch(`${API_BASE}/interview/generate-questions`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ role, resumeText, companyName }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to generate interview questions");
    }
    return data; // { role, companyName, questions: [...] }
  },

  // Submit and Evaluate Session
  async submitInterview(
    role,
    companyName,
    resumeText,
    questions,
    answers
  ) {
    const res = await fetch(`${API_BASE}/interview/submit`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ role, companyName, resumeText, questions, answers }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to evaluate answers");
    }
    return data; // Returns the complete Interview object
  },

  // Fetch Interview History list
  async getHistory() {
    const res = await fetch(`${API_BASE}/interview/history`, {
      method: "GET",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to load history list");
    }
    return data; // Array of Interview records
  },

  // Get specific Session by ID
  async getInterviewById(id) {
    const res = await fetch(`${API_BASE}/interview/${id}`, {
      method: "GET",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to load session details");
    }
    return data; // Specific Interview object
  },

  // Settings API
  async getSettings() {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "GET",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to load settings");
    }
    return data;
  },

  async updateSettings(settings) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to update settings");
    }
    return data; // { success: true, message, user }
  },

  async changePassword(currentPassword, newPasswordString) {
    const res = await fetch(`${API_BASE}/settings/password`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword: newPasswordString }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to change password");
    }
    return data; // { success: true, message }
  },

  async logoutAll() {
    const res = await fetch(`${API_BASE}/settings/logout-all`, {
      method: "POST",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to invalidate sessions");
    }
    return data; // { success: true, message }
  },

  // Job Match Compatibility APIs
  async uploadJobDescription(file) {
    const token = localStorage.getItem("ai_interview_token");
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/jd-match/upload-jd`, {
      method: "POST",
      headers,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to parse job description PDF file");
    }
    return data; // { text }
  },

  async analyzeJobMatch(resumeText, jobDescription) {
    const res = await fetch(`${API_BASE}/jd-match/analyze`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ resumeText, jobDescription }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Job match analysis failed");
    }
    return data; // Returns JobMatchAnalysis object
  },

  async getJobMatchHistory() {
    const res = await fetch(`${API_BASE}/jd-match/history`, {
      method: "GET",
      headers: getHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to fetch job match history");
    }
    return data; // Returns list of JobMatchAnalysis objects
  },
};
export default api;
