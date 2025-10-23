// src/utils/resolveByUserId.ts
import { getValidTokenByUserId } from "./mpCache";

/**
 * Devuelve access_token para un user_id si existe en caché y no expiró.
 * No refresca: los webhooks no traen empresa/modo, entonces sin mapping no se puede ir a PHP.
 */
export function resolveTokenByUserId(user_id: string): string | undefined {
  const entry = getValidTokenByUserId(String(user_id));
  return entry?.access_token;
}
