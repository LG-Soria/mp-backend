// src/controllers/pos.controller.ts
import { Request, Response } from "express";
import axios from "axios";
import { getStoredToken, getStoredUserId } from "./auth.controller";
import { getTokenFromRequest } from "../utils/getAuthToken";
import { getUserIdFromRequest } from "../utils/getUserId";

// Obtener todas las cajas (POS)
export const getPOS = async (req: Request, res: Response) => {
  const user_id = getUserIdFromRequest(req);

  const token = getTokenFromRequest(req);

  if (!token || !user_id) {
    return res.status(400).json({ error: "token y user_id son requeridos" });
  }

  try {
    const response = await axios.get(
      `https://api.mercadopago.com/pos?user_id=${user_id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.json(response.data);
  } catch (error: any) {
    console.error("Error al obtener cajas POS:", error.message);
    return res.status(500).json({ error: "Error al obtener cajas POS" });
  }
};

// Crear una caja (POS)
export const createPOS = async (req: Request, res: Response) => {
  const token = getTokenFromRequest(req);
  const posData = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token no disponible en memoria." });
  }

  // Validar campos mínimos requeridos
  const requiredFields = ["name", "external_id", "store_id", "category"];
  for (const field of requiredFields) {
    if (!posData[field]) {
      return res
        .status(400)
        .json({ error: `Falta el campo obligatorio: ${field}` });
    }
  }

  try {
    const response = await axios.post(
      "https://api.mercadopago.com/pos",
      posData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      console.error("MP error:", error.response.data);
      return res.status(500).json({ error: error.response.data });
    }

    console.error("Error desconocido al crear caja POS:", error.message);
    return res
      .status(500)
      .json({ error: "Error desconocido al crear caja POS" });
  }
};
