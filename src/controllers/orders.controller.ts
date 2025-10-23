// src/controllers/orders.controller.ts
import { Request, Response } from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { resolveUserData } from "../utils/resolveUserData";

/**
 * Crea una orden de pago (QR o Point) usando token cacheado por empresa/modo.
 */
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { _e, _m } = req.query as { _e?: string; _m?: string };
    if (!_e || !_m) {
      return res.status(400).json({ error: "Faltan parámetros: _e o _m" });
    }

    const orderPayload = req.body;
    if (!orderPayload?.type || !["qr", "point"].includes(orderPayload.type)) {
      return res.status(400).json({
        error: "Tipo de orden inválido. Debe ser 'qr' o 'point'.",
      });
    }

    // 🔑 Obtiene access_token desde cache o refresca con PHP si expiró
    const { access_token } = await resolveUserData(req, _e, _m);

    const idempotencyKey = uuidv4();

    console.log("========== CREAR ORDEN ==========");
    console.log("Empresa:", _e, "| Modo:", _m);
    console.log("Payload recibido:", JSON.stringify(orderPayload, null, 2));

    const mpResponse = await axios.post(
      "https://api.mercadopago.com/v1/orders",
      orderPayload,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey,
        },
      }
    );

    console.log("✅ Orden creada correctamente");
    return res.status(200).json(mpResponse.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const message = error.message || "Error desconocido";
    const errorData = error.response?.data || {};

    console.error("❌ Error al crear la orden:");
    console.error("Código de estado:", status);
    console.error("Mensaje:", message);
    console.error("Respuesta de MP:", JSON.stringify(errorData, null, 2));

    return res.status(status).json({
      error: "Error al crear la orden en Mercado Pago",
      details: errorData,
    });
  }
};

/**
 * Obtiene los datos de una orden por ID, usando el token cacheado por empresa/modo.
 */
export const getOrder = async (req: Request, res: Response) => {
  try {
    const { _e, _m } = req.query as { _e?: string; _m?: string };
    const { orderId } = req.params;

    if (!_e || !_m) {
      return res.status(400).json({ error: "Faltan parámetros: _e o _m" });
    }
    if (!orderId) {
      return res.status(400).json({ error: "Falta el parámetro 'orderId' en la URL." });
    }

    // 🔑 access_token desde cache
    const { access_token } = await resolveUserData(req, _e, _m);

    const mpResponse = await axios.get(
      `https://api.mercadopago.com/v1/orders/${orderId}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    return res.status(200).json(mpResponse.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const errorData = error.response?.data || {};
    console.error("Error al obtener la orden:", errorData || error.message);
    return res.status(status).json({
      error: "Error al obtener la orden desde Mercado Pago",
      details: errorData,
    });
  }
};
