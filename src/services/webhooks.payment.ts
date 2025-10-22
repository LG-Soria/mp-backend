import { getAuthToken } from "../utils/getAuthToken";
import { logger } from "../utils/logger";

const processed = new Map<string, number>();
const TTL_MS = 1000 * 60 * 60 * 12;

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

/** Procesamiento de payment */
export async function processPaymentNotification(paymentId: string, _meta: Record<string, unknown>) {
  try {
    if (isProcessed(paymentId)) {
      logger.info(`[MP Webhook] payment ignorado por idempotencia id=${paymentId}`);
      return;
    }

    const token = await getAuthToken(); 
    const url = `https://api.mercadopago.com/v1/payments/${paymentId}`;

    const r = await fetch(url, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) {
      const tx = await r.text();
      logger.error(`[MP Webhook] error consultando pago id=${paymentId} status=${r.status} body=${tx}`);
      return;
    }

    const payment = (await r.json()) as any;
    const status: string = payment.status;
    const externalReference: string | undefined = payment.external_reference;

    logger.info(`[MP Webhook] payment id=${paymentId} status=${status} extRef=${externalReference}`);

    // TODO: actualizar orden interna
    // updateOrderStatus(externalReference, status, payment);

    markProcessed(paymentId);
  } catch (err) {
    logger.error(`[MP Webhook] error processPayment id=${paymentId}`, err);
  }
}
