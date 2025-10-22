import type { Request, Response } from "express";
import { verifyMpSignature } from "../utils/mpWebhook";
import { logger } from "../utils/logger";
import { processPaymentNotification } from "../services/webhooks.service";

/**
 * Controlador de Webhook MP.
 * - Valida firma x-signature.
 * - Hace ACK rápido (202) y procesa asíncrono.
 */
export async function handleMpWebhook(req: Request, res: Response) {
  try {
    const paymentId = (req.query["data.id"] || req.query["id"]) as string | undefined;
    const xRequestId = req.header("x-request-id") || "";
    const xSignature = req.header("x-signature") || "";

    if (!paymentId) {
      logger.warn("[MP Webhook] Falta data.id en query");
      return res.status(400).json({ ok: false, error: "missing data.id" });
    }

    // Validación de firma
    const isValid = verifyMpSignature({
      signatureHeader: xSignature,
      requestId: xRequestId,
      id: paymentId,
      secret: process.env.MP_WEBHOOK_SECRET || "",
    });

    if (!isValid) {
      logger.warn(`[MP Webhook] Firma inválida. id=${paymentId}`);
      return res.status(401).json({ ok: false });
    }

    // ACK rápido (se recomienda no bloquear)
    res.status(202).json({ ok: true });

    // Procesamiento asíncrono (sin esperar la respuesta al webhook)
    processPaymentNotification(paymentId, {
      xRequestId,
      receivedAt: new Date().toISOString(),
      rawQuery: req.query as Record<string, any>,
      rawHeaders: req.headers,
    }).catch((err) => {
      logger.error(`[MP Webhook] Error en proceso asíncrono id=${paymentId}`, err);
    });
  } catch (err) {
    logger.error("[MP Webhook] Error inesperado", err);
    // En caso de error, responder algo para evitar reintentos infinitos por timeout
    return res.status(200).json({ ok: true });
  }
}
