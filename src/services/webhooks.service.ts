import { MpWebhookMeta } from "../types/mp-webhook";
import { getAuthToken, getTokenFromRequest } from "../utils/getAuthToken";
import { logger } from "../utils/logger";

/**
 * Idempotencia simple en memoria para evitar reprocesos.
 * Importante: en producción conviene Redis u otro store compartido.
 */
const processed = new Map<string, number>(); // paymentId -> timestamp
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
 * Obtiene el pago desde MP y decide acciones (actualizar orden, etc.).
 */
export async function processPaymentNotification(
  paymentId: string,
  meta: MpWebhookMeta
) {
  try {
    if (isProcessed(paymentId)) {
      logger.info(`[MP Webhook] Ignorado por idempotencia id=${paymentId}`);
      return;
    }

    const token = await getAuthToken();
    const url = `https://api.mercadopago.com/v1/payments/${paymentId}`;

    const r = await fetch(url, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!r.ok) {
      const tx = await r.text();
      logger.error(`[MP Webhook] Error consultando pago id=${paymentId} status=${r.status} body=${tx}`);
      return;
    }

    const payment = (await r.json()) as any;

    // Ejemplo de enrutamiento por status (approved, rejected, pending, etc.)
    const status: string = payment.status;
    const externalReference: string | undefined = payment.external_reference;

    logger.info(`[MP Webhook] Pago id=${paymentId} status=${status} extRef=${externalReference}`);

    // TODO: acá se actualiza dominio interno (orden, suscripción, etc.)
    // Ejemplos:
    // - updateOrderStatus(externalReference, status, payment);
    // - registrarPago(paymentId, payment);

    // Marcar como procesado
    markProcessed(paymentId);
  } catch (err) {
    logger.error(`[MP Webhook] Error proceso id=${paymentId}`, err);
  }
}
