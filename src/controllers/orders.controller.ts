import { Request, Response } from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { getTokenFromRequest } from "../utils/getAuthToken";


export const createOrder = async (req: Request, res: Response) => {
  const token = getTokenFromRequest(req);
  const orderPayload = req.body;

  console.log("========== CREAR ORDEN ==========");
  console.log("Token recibido:", token || "❌ No hay token");
  console.log("Payload recibido:", JSON.stringify(orderPayload, null, 2));

  if (!token) {
    console.warn("⚠️ No se recibió token. Cancelando...");
    return res.status(401).json({
      error: "Token de Mercado Pago no disponible. Autenticación requerida.",
    });
  }

  if (!orderPayload.type || !["qr", "point"].includes(orderPayload.type)) {
    console.warn("⚠️ Tipo de orden inválido:", orderPayload.type);
    return res.status(400).json({
      error: "Tipo de orden inválido. Debe ser 'qr' o 'point'.",
    });
  }

  try {
    const idempotencyKey = uuidv4();

    const mpResponse = await axios.post(
      "https://api.mercadopago.com/v1/orders",
      orderPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
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
    console.error("Respuesta de Mercado Pago:", JSON.stringify(errorData, null, 2));

    return res.status(status).json({
      error: "Error al crear la orden en Mercado Pago",
      details: errorData,
    });
  }
};
export const getOrder = async (req: Request, res: Response) => {
  const token = getTokenFromRequest(req);
  const { orderId } = req.params;

  if (!token) {
    return res.status(401).json({
      error: "Token de Mercado Pago no disponible. Autenticación requerida.",
    });
  }

  if (!orderId) {
    return res.status(400).json({
      error: "Falta el parámetro 'orderId' en la URL.",
    });
  }

  try {
    const mpResponse = await axios.get(
      `https://api.mercadopago.com/v1/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.status(200).json(mpResponse.data);
  } catch (error: any) {
    console.error(
      "Error al obtener la orden:",
      error.response?.data || error.message
    );
    return res.status(error.response?.status || 500).json({
      error:
        error.response?.data || "Error al obtener la orden desde Mercado Pago",
    });
  }
};
