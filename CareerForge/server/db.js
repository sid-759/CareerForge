import fs from "fs";
import path from "path";

const DB_DIR = path.join(process.cwd(), "server", "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Ensure data directory and file exist
function initializeDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      interviews: [],
      jobMatchAnalyses: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  } else {
    // Self-healing migration for existing local databases
    try {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const db = JSON.parse(content);
      if (!db.jobMatchAnalyses) {
        db.jobMatchAnalyses = [];
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
      }
    } catch (e) {
      console.error("Migration error", e);
    }
  }
}

// Read database from disk
export function readDb() {
  initializeDatabase();
  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(content);
    if (!parsed.jobMatchAnalyses) {
      parsed.jobMatchAnalyses = [];
    }
    return parsed;
  } catch (err) {
    console.error("Error reading db file, returning empty state", err);
    return { users: [], interviews: [], jobMatchAnalyses: [] };
  }
}

// Write database to disk
export function writeDb(data) {
  initializeDatabase();
  try {
    if (!data.jobMatchAnalyses) {
      data.jobMatchAnalyses = [];
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing db file", err);
  }
}

// helper user management methods
export function findUserByEmail(email) {
  const db = readDb();
  return db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

// find user by id
export function findUserById(id) {
  const db = readDb();
  return db.users.find((u) => u.id === id);
}

// create user
export function createUser(user) {
  const db = readDb();
  db.users.push(user);
  writeDb(db);
}

// update user
export function updateUser(id, updates) {
  const db = readDb();
  const index = db.users.findIndex((u) => u.id === id);
  if (index !== -1) {
    db.users[index] = { ...db.users[index], ...updates };
    writeDb(db);
    return db.users[index];
  }
  return undefined;
}

// helper interview management methods
export function getInterviewsByUserId(userId) {
  const db = readDb();
  return db.interviews
    .filter((i) => i.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// get interview by id
export function getInterviewById(id) {
  const db = readDb();
  return db.interviews.find((i) => i.id === id);
}

// save interview
export function saveInterview(interview) {
  const db = readDb();
  db.interviews.push(interview);
  writeDb(db);
}

// update interview
export function updateInterview(id, updates) {
  const db = readDb();
  const index = db.interviews.findIndex((i) => i.id === id);
  if (index !== -1) {
    db.interviews[index] = { ...db.interviews[index], ...updates };
    writeDb(db);
  }
}

// helper job match management methods
export function getJobMatchAnalysesByUserId(userId) {
  const db = readDb();
  const analyses = db.jobMatchAnalyses || [];
  return analyses
    .filter((a) => a.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// save job match analysis
export function saveJobMatchAnalysis(analysis) {
  const db = readDb();
  if (!db.jobMatchAnalyses) {
    db.jobMatchAnalyses = [];
  }
  db.jobMatchAnalyses.push(analysis);
  writeDb(db);
}
