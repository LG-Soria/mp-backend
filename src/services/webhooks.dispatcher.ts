import { MpWebhookBody } from "../types/mp-webhook";
import { logger } from "../utils/logger";
import { processPaymentNotification } from "./webhooks.service";

/**
 * Enruta el evento por type/action.
 * Se prioriza id por data.id y se cae a id (si viniera).
 */
export async function dispatchMpEvent(body: MpWebhookBody, meta: MpWebhookMeta) {
  const type = (body.type || "").toLowerCase();
  const action = (body.action || "").toLowerCase();
  const dataId = body?.data?.id || body?.id || null;

  logger.info(`[MP Webhook] type=${type} action=${action} data.id=${dataId} user_id=${body.user_id}`);

  switch (type) {
    case "payment":
      if (!dataId) {
        logger.warn("[MP Webhook] payment sin data.id");
        return;
      }
      await processPaymentNotification(dataId, meta);
      return;

    case "merchant_order":
      // TODO: implementar si se requiere
      logger.info("[MP Webhook] merchant_order recibido (TODO)");
      return;

    case "mp-connect":
      await handleMpConnect(action, body, meta);
      return;

    default:
      logger.info(`[MP Webhook] type no manejado: ${type}`);
  }
}
