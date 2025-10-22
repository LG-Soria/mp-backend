import type { Request, Response } from "express";
import { verifyMpSignature } from "../utils/mpWebhook";
import { logger } from "../utils/logger";
import { processPaymentNotification } from "../services/webhooks.service";
import { MpWebhookBody } from "../types/mp-webhook";
import { dispatchMpEvent } from "../services/webhooks.dispatcher";


/**
 * Controlador del Webhook.
 * - Valida firma x-signature.
 * - ACK rápido (202).
 * - Procesa en background por type/action.
 */
export async function handleMpWebhook(req: Request, res: Response) {
  try {
    const xRequestId = req.header("x-request-id") || "";
    const xSignature = req.header("x-signature") || "";

    // Para compatibilidad con "payment", el id suele venir como query data.id
    const queryPaymentId = (req.query["data.id"] || req.query["id"]) as string | undefined;

    // Validación de firma (se usa el id de query si existe; si no, se usa "0")
    const signatureId = queryPaymentId || "0";
    const isValid = verifyMpSignature({
      signatureHeader: xSignature,
      requestId: xRequestId,
      id: signatureId,
      secret: process.env.MP_WEBHOOK_SECRET || "",
    });

    if (!isValid) {
      logger.warn(`[MP Webhook] Firma inválida. id=${signatureId}`);
      return res.status(401).json({ ok: false });
    }

    // ACK rápido
    res.status(202).json({ ok: true });

    // Despacho asíncrono
    const body = (req.body || {}) as MpWebhookBody;
    dispatchMpEvent(body, {
      xRequestId,
      receivedAt: new Date().toISOString(),
      rawQuery: req.query as Record<string, any>,
      rawHeaders: req.headers,
    }).catch((err) => logger.error("[MP Webhook] Error en dispatcher", err));
  } catch (err) {
    logger.error("[MP Webhook] Error inesperado", err);
    return res.status(200).json({ ok: true });
  }
}
