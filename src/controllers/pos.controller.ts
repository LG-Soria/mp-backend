// src/controllers/pos.controller.ts
import { Request, Response } from "express";
import axios from "axios";
import { resolveUserData } from "../utils/resolveUserData";

// Obtener todas las cajas (POS)
export const getPOS = async (req: Request, res: Response) => {
  try {
    const { _e, _m } = req.query as { _e?: string; _m?: string };
    if (!_e || !_m) {
      return res.status(400).json({ error: "Faltan parámetros: _e o _m" });
    }

    // token + user_id desde cache (o refresh automático vía PHP)
    const { access_token, user_id } = await resolveUserData(req, _e, _m);

    const { data } = await axios.get(
      `https://api.mercadopago.com/pos?user_id=${user_id}`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    return res.json(data);
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("MP error (getPOS):", error.response?.data || error.message);
      return res
        .status(error.response?.status || 500)
        .json({ error: error.response?.data || "Error al obtener cajas POS" });
    }
    console.error("Error desconocido (getPOS):", error?.message || error);
    return res.status(500).json({ error: "Error al obtener cajas POS" });
  }
};

// Crear una caja (POS)
export const createPOS = async (req: Request, res: Response) => {
  try {
    const { _e, _m } = req.query as { _e?: string; _m?: string };
    if (!_e || !_m) {
      return res.status(400).json({ error: "Faltan parámetros: _e o _m" });
    }

    // token + user_id desde cache (o refresh automático)
    const { access_token } = await resolveUserData(req, _e, _m);

    const posData = req.body;

    // Validar campos mínimos requeridos por MP POS
    const requiredFields = ["name", "external_id", "store_id", "category"];
    for (const f of requiredFields) {
      if (!posData?.[f]) {
        return res.status(400).json({ error: `Falta el campo obligatorio: ${f}` });
      }
    }

    const { data } = await axios.post(
      "https://api.mercadopago.com/pos",
      posData,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json(data);
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error("MP error (createPOS):", error.response?.data || error.message);
      return res
        .status(error.response?.status || 500)
        .json({ error: error.response?.data || "Error al crear caja POS" });
    }
    console.error("Error desconocido (createPOS):", error?.message || error);
    return res.status(500).json({ error: "Error desconocido al crear caja POS" });
  }
};
