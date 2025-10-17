// src/utils/getAuthToken.ts
import { Request } from "express";
import { getStoredToken } from "../controllers/auth.controller"; // o desde donde lo tengas

export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  // console.log('obtener auth', authHeader)
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return getStoredToken();
}
