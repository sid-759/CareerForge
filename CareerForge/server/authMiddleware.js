import jwt from "jsonwebtoken";
import { findUserById } from "./db.js";

export const JWT_SECRET = process.env.JWT_SECRET;

// JWT_SECRET validation happens at server startup in server.js
// This is a defensive check in case it's ever null
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be configured. This check should have been caught at server startup.");
}

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Access denied. No authorization token provided." });
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Token format error. Must be Bearer <token>" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    if (!decoded || typeof decoded !== "object" || typeof decoded.userId !== "string") {
      return res.status(401).json({ error: "Invalid or expired session token." });
    }
    const user = findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "Access denied. User no longer exists." });
    }
    
    // Validate jwtVersion if user has one configured
    if (user.jwtVersion !== undefined && decoded.jwtVersion !== undefined && decoded.jwtVersion !== user.jwtVersion) {
      return res.status(401).json({ error: "Your session has been invalidated from another device. Please log in again." });
    }
    
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session token." });
  }
}
