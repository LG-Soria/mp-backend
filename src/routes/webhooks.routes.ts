import { Router } from "express";
import { handleMpWebhook } from "../controllers/webhooks.controller";

const router = Router();

/**
 * Webhook Mercado Pago (Checkout Pro)
 * - Método: POST
 * - Query esperada: data.id (o id)
 * - Headers: x-request-id, x-signature
 */
router.post("/webhooks/mp", handleMpWebhook);

export default router;
