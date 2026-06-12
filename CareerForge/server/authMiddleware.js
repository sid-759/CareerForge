import jwt from "jsonwebtoken";
import { findUserById } from "./db.js";

export const JWT_SECRET = process.env.JWT_SECRET || "interview-simulator-jwt-super-secret-key-2026";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Access denied. No authorization token provided." });
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ error: "Token format error. Must be Bearer <token>" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
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
