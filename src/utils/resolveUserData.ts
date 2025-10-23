// src/utils/resolveUserData.ts
import type { Request } from "express";
import axios from "axios";
import { getMpCache, isExpired, setMpCache } from "./mpCache";

/**
 * Resuelve access_token y user_id para una empresa+modo.
 * 1) Si hay cache y no expiró, retornar.
 * 2) Si no hay o expiró, invocar al endpoint local /auth/token para renovar desde PHP.
 */
export async function resolveUserData(req: Request, empresa: string, modo: string) {
  const cached = getMpCache(empresa, modo);
  if (cached && !isExpired(cached)) {
    return { access_token: cached.access_token, user_id: cached.user_id };
  }

  // Llamado interno al propio backend para refrescar cache desde PHP
  // Si hay un router en Vercel como /api/auth/token, ajustar la base según corresponda (por ejemplo, req.protocol + '://' + req.get('host')).
  const base = `${req.protocol}://${req.get("host")}`;
  const url = `${base}/api/auth/token?_e=${encodeURIComponent(empresa)}&_m=${encodeURIComponent(modo)}`;

  const { data } = await axios.get(url);

  const access_token = data?.token as string;
  const user_id = String(data?.user_id ?? "");
  const expires_in = data?.expires_in as number | undefined;

  if (!access_token || !user_id) {
    throw new Error("No se pudo resolver access_token/user_id desde /auth/token");
  }

  // Guardado redundante en cache por si se usa este helper fuera del controller de token
  const ttlMs = typeof expires_in === "number" && expires_in > 0
    ? Math.max((expires_in - 60) * 1000, 30_000)
    : 55 * 60 * 1000;

  setMpCache(empresa, modo, {
    access_token,
    user_id,
    exp: Date.now() + ttlMs,
  }, "php");

  return { access_token, user_id };
}
