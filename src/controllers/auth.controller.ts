// src/controllers/auth.controller.ts
import type { Request, Response } from "express";
import { setMpCache } from "../utils/mpCache";
import axios from "axios";

/**
 * Obtiene token y user_id desde el backend PHP y lo guarda en cache por empresa+modo.
 * La expiración se calcula con expires_in si está disponible; caso contrario, TTL por defecto.
 */
export const getTokenFromPHP = async (req: Request, res: Response) => {
  try {
    const { _e, _m } = req.query as { _e?: string; _m?: string };

    if (!_e || !_m) {
      return res.status(400).json({ error: "Faltan parámetros: _e o _m" });
    }

    const payload = JSON.stringify({ _e, _m, _a: "3" });
    const phpUrl =
      `https://apiphp.novagestion.com.ar/apinovades/mercadopago/obtenerMercadoToken.php?_i=${encodeURIComponent(payload)}`;

    const response = await axios.get(phpUrl);
    const data = response.data;

    const access_token: string | undefined = data?.data?.access_token;
    const user_id: number | string | undefined = data?.data?.user_id;
    const expires_in: number | undefined = data?.data?.expires_in; // en segundos, si viene

    if (!access_token || !user_id) {
      return res.status(500).json({ error: "Token o user_id faltantes en la respuesta" });
    }

    // TTL: si viene expires_in, respetar; caso contrario usar 55 minutos.
    const ttlMs = typeof expires_in === "number" && expires_in > 0
      ? Math.max((expires_in - 60) * 1000, 30_000)   // margen de 60s, mínimo 30s
      : 55 * 60 * 1000;

    const exp = Date.now() + ttlMs;

    // Guardar en cache por empresa+modo
    setMpCache(_e, _m, { access_token, user_id: String(user_id), exp }, "php");

    // Respuesta útil para el front actual (entorno de prueba)
    return res.status(200).json({
      message: "Token y User ID obtenidos y cacheados correctamente",
      token: access_token,
      user_id: String(user_id),
      expires_in: expires_in ?? Math.round(ttlMs / 1000),
      exp, // timestamp
    });
  } catch (error: any) {
    console.error("Error al obtener token desde PHP:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || "Error al obtener token en el backend PHP",
    });
  }
};
