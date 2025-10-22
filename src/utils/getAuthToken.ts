// src/utils/getAuthToken.ts
import { Request } from "express";
import { getStoredToken } from "../controllers/auth.controller"; // o desde donde lo tengas

export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return null;
}

export function getAuthToken(): string | null {
  return getStoredToken();
}