// src/controllers/stores.controller.ts
import { Request, Response } from "express";
import axios from "axios";
import { resolveUserData } from "../utils/resolveUserData";

function tryParseJSON(str?: unknown) {
  if (typeof str !== "string") return str;
  const s = str.trim();
  if (!(s.startsWith("{") || s.startsWith("["))) return str;
  try { return JSON.parse(s); } catch { return str; }
}

export const getStores = async (req: Request, res: Response) => {
  try {
    // ✅ patrón por query params
    const { _e, _m } = req.query as { _e?: string; _m?: string };
    if (!_e || !_m) {
      return res.status(400).json({ error: "Faltan parámetros: _e o _m" });
    }

    // 🔑 Resuelve (o refresca) access_token + user_id desde cache/PHP
    const { access_token, user_id } = await resolveUserData(req, _e, _m);

    // 📦 Llamada oficial a MP
    const { data } = await axios.get(
      `https://api.mercadopago.com/users/${user_id}/stores/search`,
      
      { headers: { Authorization: `Bearer ${access_token}` } }
    );

    // Normalizo salida como ya venías usando
    return res.json({ sucursales: data?.results ?? [] });
  } catch (error: any) {
    console.error("Error al obtener sucursales:", error?.message || error);

    if (error?.response) {
      const mpRaw = error.response.data;
      const maybeParsed = tryParseJSON(mpRaw?.message);
      const mpDetail = typeof maybeParsed === "object" && maybeParsed !== null ? maybeParsed : mpRaw;

      return res.status(error.response.status || 500).json({
        error: "Error al obtener sucursales",
        status: error.response.status,
        detalle: mpDetail,
        hints: [
          "Verificar que el token sea válido para la empresa/mode solicitados.",
          "Si el token expiró, el backend lo renovará automáticamente.",
        ],
      });
    }

    if (error?.request) {
      return res.status(502).json({
        error: "No se recibió respuesta de Mercado Pago",
        detalle: "timeout / network / DNS / bloqueo",
      });
    }

    return res.status(500).json({
      error: "Error inesperado al obtener sucursales",
      detalle: String(error?.message || error),
    });
  }
};

export const createStore = async (req: Request, res: Response) => {
  try {
    const { _e, _m } = req.query as { _e?: string; _m?: string };
    if (!_e || !_m) {
      return res.status(400).json({ error: "Faltan parámetros: _e o _m" });
    }

    const body = req.body ?? {};
    const missing: string[] = [];

    if (!body.name) missing.push("name");
    if (!body.external_id) missing.push("external_id");

    const loc = body.location || {};
    const reqLoc = [
      "street_number",
      "street_name",
      "city_name",
      "state_name",
      "latitude",
      "longitude",
    ];
    for (const f of reqLoc) {
      if (loc[f] === undefined || loc[f] === null || loc[f] === "") {
        missing.push(`location.${f}`);
      }
    }

    if (missing.length) {
      return res.status(400).json({
        error: "Faltan campos obligatorios para crear la sucursal",
        missing,
        hint:
          "Para Store: name, external_id y location completo. No mandar store_id ni category (eso es de POS).",
      });
    }

    const { access_token, user_id } = await resolveUserData(req, _e, _m);

    const { data } = await axios.post(
      `https://api.mercadopago.com/users/${user_id}/stores`,
      body,
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
      return res
        .status(error.response?.status || 500)
        .json({ error: error.response?.data || "Error desconocido" });
    }
    return res
      .status(500)
      .json({ error: "Error inesperado al crear la sucursal" });
  }
};
