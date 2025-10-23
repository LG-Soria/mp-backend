import { MpWebhookMeta } from "../types/mp-webhook";
import { logger } from "../utils/logger";
import { extractUserId } from "../utils/extractUserId";
import { resolveTokenByUserId } from "../utils/resolveByUserId";

const processed = new Map<string, number>(); // paymentId -> ts
const TTL_MS = 1000 * 60 * 60 * 12; // 12h

function isProcessed(id: string) {
  const ts = processed.get(id);
  if (!ts) return false;
  if (Date.now() - ts > TTL_MS) {
    processed.delete(id);
    return false;
  }
  return true;
}
function markProcessed(id: string) {
  processed.set(id, Date.now());
}

/**
 * Procesa un webhook de payment.
 * Ahora depende del caché indexado por user_id (no de getAuthToken global).
 * - `meta` debe incluir rawHeaders/rawQuery; 
 * - `body` es el JSON crudo del webhook (contiene user_id y data.id).
 */
export async function processPaymentNotification(
  paymentId: string,
  meta: MpWebhookMeta,
  body: any
) {
  try {
    if (isProcessed(paymentId)) {
      logger.info(`[MP Webhook] payment ignorado por idempotencia id=${paymentId}`);
      return;
    }

    // 1) user_id del webhook → token desde caché
    const userId = extractUserId(meta, body);
    if (!userId) {
      logger.error(`[MP Webhook] No se pudo extraer user_id. type=${meta.type} action=${meta.action}`);
      return;
    }

    const token = resolveTokenByUserId(userId);
    if (!token) {
      logger.error(
        `[MP Webhook] No hay token válido en caché para user_id=${userId}. ` +
        `Precalentar en application.authorized llamando /api/auth/token?_e=<empresa>&_m=<modo>.`
      );
      return;
    }

    // 2) Consultar pago en MP
    const url = `https://api.mercadopago.com/v1/payments/${paymentId}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });

    if (!r.ok) {
      const tx = await r.text();
      logger.error(`[MP Webhook] error consultando pago id=${paymentId} status=${r.status} body=${tx}`);
      return;
    }

    const payment = await r.json();
    const status: string = payment?.status;
    const externalReference: string | undefined = payment?.external_reference;

    logger.info(`[MP Webhook] payment id=${paymentId} status=${status} extRef=${externalReference} user_id=${userId}`);

    // TODO: actualizar orden interna
    // updateOrderStatus(externalReference, status, payment);

    markProcessed(paymentId);
  } catch (err) {
    logger.error(`[MP Webhook] error processPayment id=${paymentId}`, err);
  }
}
