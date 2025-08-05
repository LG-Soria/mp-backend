import { Request, Response } from "express";
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { getTokenFromRequest } from "../utils/getAuthToken";

export const createOrder = async (req: Request, res: Response) => {
  const token = getTokenFromRequest(req);
  console.log("Body recibido:", req.body);

  if (!token) {
    return res.status(401).json({
      error: "Token de Mercado Pago no disponible. Autenticación requerida.",
    });
  }

  try {
    const orderPayload = req.body;

    if (!orderPayload.type || !["qr", "point"].includes(orderPayload.type)) {
      return res
        .status(400)
        .json({ error: "Tipo de orden inválido. Debe ser 'qr' o 'point'." });
    }

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
    console.log("Token utilizado:", token);
    console.log("Payload enviado:", JSON.stringify(orderPayload, null, 2));
    return res.status(200).json(mpResponse.data);
  } catch (error: any) {
    const errorData = error.response?.data || {};
    console.error(
      "Error al crear la orden:",
      JSON.stringify(errorData, null, 2)
    );

    return res.status(error.response?.status || 500).json({
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
