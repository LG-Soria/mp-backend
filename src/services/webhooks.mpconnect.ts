// import { getAuthToken } from "@/utils/getAuthToken";
// import fetch from "node-fetch";

import { MpWebhookBody, MpWebhookMeta } from "../types/mp-webhook";
import { logger } from "../utils/logger";
import { fetchMlUser } from "./ml-users.service";


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
  if (!userId) {
    logger.warn("[MP Webhook][mp-connect] user_id ausente en body");
    return;
  }

  switch (action) {
    case "application.authorized":
      await onApplicationAuthorized(userId, body, meta);
      break;

    case "application.deauthorized":
      await onApplicationDeauthorized(userId, body, meta);
      break;

    default:
      logger.info(`[MP Webhook][mp-connect] Action no manejada: ${action}`);
      break;
  }
}

async function onApplicationAuthorized(userId: number, body: MpWebhookBody, meta: MpWebhookMeta) {
  // Obtención de datos públicos del usuario (nickname, business_name, etc.)
  try {
    const mlUser = await fetchMlUser(userId);
    logger.info(`[MP Webhook][mp-connect] ✅ Authorized - user_id=${userId}`, {
      core: {
        nickname: mlUser?.nickname,
        business_name: mlUser?.business_name,
        first_name: mlUser?.first_name,
        last_name: mlUser?.last_name,
      },
      rawUser: mlUser, // se deja crudo para inspección inicial
      meta,
    });

    // TODO: persistir vínculo en BD (ejemplo):
    // await mpAccountsRepo.link({
    //   user_id: userId,
    //   nickname: mlUser?.nickname ?? null,
    //   business_name: mlUser?.business_name ?? null,
    //   linked_at: meta.receivedAt,
    // });

  } catch (err) {
    logger.error(`[MP Webhook][mp-connect] Error al obtener ML user (${userId})`, err);
  }
}

async function onApplicationDeauthorized(userId: number, body: MpWebhookBody, meta: MpWebhookMeta) {
  logger.info(`[MP Webhook][mp-connect] ❌ Deauthorized - user_id=${userId}`, { body, meta });

  // TODO: marcar desvinculado en BD (ejemplo):
  // await mpAccountsRepo.unlink({ user_id: userId, unlinked_at: meta.receivedAt });
}
