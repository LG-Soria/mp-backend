import { Request } from "express";
import { getStoredUserId } from "../controllers/auth.controller";

export function getUserIdFromRequest(req: Request): string | null {
  const userIdHeader = req.headers["x-user-id"] as string | undefined;
  console.log('user id', userIdHeader)

  if (typeof userIdHeader === "string" && userIdHeader.trim() !== "") {
    return userIdHeader;
  }

  return getStoredUserId();
}
