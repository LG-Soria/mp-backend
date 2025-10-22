// src/controllers/ml-users.controller.ts
import type { Request, Response } from "express";
import { fetchUserInfoByBusinessParams, fetchUserInfoByTokenDev, MlUsersError } from "../services/ml-users.service";

/** POST /mp/user-info
 * body: { empresa: string, modo: "homo"|"prod", app: string }
 * objetivo: resolver nombre/nickname sin exponer access_token al frontend
 */
export async function postUserInfo(req: Request, res: Response) {
  try {
    const { empresa, modo, app } = req.body || {};
    if (!empresa || !modo || !app) {
      return res.status(400).json({ ok: false, error: "bad_request" });
    }

    const result = await fetchUserInfoByBusinessParams({ empresa: String(empresa), modo, app: String(app) });
    return res.json(result);
  } catch (err: any) {
    if (err instanceof MlUsersError) {
      return res.status(502).json({ ok: false, error: err.message });
    }
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

/** POST /mp/user-info/by-token  (solo DEV)
 * body: { userId: number, accessToken: string }
 * objetivo: endpoint de prueba local para bypass del PHP
 */
export async function postUserInfoByTokenDev(req: Request, res: Response) {
  try {
    const { userId, accessToken } = req.body || {};
    if (!userId || !accessToken) {
      return res.status(400).json({ ok: false, error: "bad_request" });
    }
    const result = await fetchUserInfoByTokenDev(Number(userId), String(accessToken));
    return res.json(result);
  } catch {
    return res.status(502).json({ ok: false, error: "ml_user_fetch_failed" });
  }
}
