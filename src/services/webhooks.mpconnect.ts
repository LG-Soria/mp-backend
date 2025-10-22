// import { getAuthToken } from "@/utils/getAuthToken";
// import fetch from "node-fetch";

import { MpWebhookBody, MpWebhookMeta } from "../types/mp-webhook";
import { logger } from "../utils/logger";


/**
 * Handler genérico para eventos mp-connect.
 * Loguea absolutamente todo lo que llega para análisis.
 */
export async function handleMpConnect(action: string, body: MpWebhookBody, meta: MpWebhookMeta) {
  logger.info("──────────────────────────────────────────────");
  logger.info("[MP Webhook][mp-connect] Nueva notificación recibida");
  logger.info("Action:", action || "(sin action)");
  logger.info("User ID:", body.user_id || "(sin user_id)");
  logger.info("Body completo:\n", JSON.stringify(body, null, 2));
  logger.info("Metadatos:\n", JSON.stringify(meta, null, 2));
  logger.info("──────────────────────────────────────────────");

  const userId = body.user_id;

  // Si no viene user_id, igual lo registramos completo
  if (!userId) {
    logger.warn("[MP Webhook][mp-connect] user_id ausente en body");
    return;
  }

  switch (action) {
    case "application.authorized":
      logger.info(`[MP Webhook][mp-connect] ✅ Authorized - user_id=${userId}`);
      // TODO: guardar vinculación
      break;

    case "application.deauthorized":
      logger.info(`[MP Webhook][mp-connect] ❌ Deauthorized - user_id=${userId}`);
      // TODO: eliminar o marcar desvinculado
      break;

    default:
      logger.info(`[MP Webhook][mp-connect] ⚠️ Action no manejada: ${action}`);
      break;
  }
}


/** Cuando la cuenta autoriza la aplicación */
async function onApplicationAuthorized(userId: number, body: MpWebhookBody, meta: MpWebhookMeta) {
  // TODO: persistir el vínculo en BD (ej.: tabla mp_accounts)
  // saveMpAccount({ userId, linked: true, linkedAt: meta.receivedAt })

  // Opcional: consultar datos del usuario en MP con el token de plataforma
  // const token = await getAuthToken();
  // const r = await fetch(`https://api.mercadopago.com/users/${userId}`, {
  //   headers: { Authorization: `Bearer ${token}` }
  // });
  // const userInfo = r.ok ? await r.json() : null;

  // TODO: adjuntar userInfo a la cuenta si hiciera falta

  // Notificación de sistema
  logger.info(`[MP Webhook][mp-connect] authorized user_id=${userId}`, {
    body,
    meta,
  });
}

/** Cuando la cuenta revoca la autorización */
async function onApplicationDeauthorized(userId: number, body: MpWebhookBody, meta: MpWebhookMeta) {
  // TODO: marcar como desvinculado en BD
  // saveMpAccount({ userId, linked: false, unlinkedAt: meta.receivedAt })

  // TODO: desactivar POS/QR/funciones asociadas a esa cuenta, invalidar tokens si corresponde

  logger.info(`[MP Webhook][mp-connect] deauthorized user_id=${userId}`, {
    body,
    meta,
  });
}
