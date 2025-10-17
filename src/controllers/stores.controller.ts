import { Request, Response } from "express";
import axios from "axios";
import { getTokenFromRequest } from "../utils/getAuthToken";
import { getUserIdFromRequest } from "../utils/getUserId";
function tryParseJSON(str?: unknown) {
  if (typeof str !== "string") return str;
  const s = str.trim();
  if (!(s.startsWith("{") || s.startsWith("["))) return str;
  try {
    return JSON.parse(s);
  } catch {
    return str;
  }
}

function maskToken(token: string) {
  const t = token.trim();
  if (t.length <= 10) return "***";
  return `${t.slice(0, 6)}…${t.slice(-6)} (len=${t.length})`;
}

export const getStores = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const token = getTokenFromRequest(req);

  // Log útil (sin exponer el token completo)
  console.log("getStores:userId=", userId);
  console.log("getStores:token=", token ? maskToken(token) : "⛔ no token");

  if (!token || !userId) {
    return res.status(400).json({ error: "token y userId son requeridos" });
  }

  // Sugerencia: chequeo rápido de formato
  const trimmed = token.trim();
  if (!/^APP_USR-[A-Za-z0-9._-]+$/.test(trimmed)) {
    console.warn("⚠️ Posible token malformado:", maskToken(trimmed));
  }

  try {
    const response = await axios.get(
      `https://api.mercadopago.com/users/${userId}/stores/search`,
      { headers: { Authorization: `Bearer ${trimmed}` } }
    );
    return res.json({ sucursales: response.data.results });
  } catch (error: any) {
    // Log completo para server
    console.error("Error al obtener sucursales:", error?.message || error);

    if (error?.response) {
      const mpRaw = error.response.data; // lo que devolvió MP
      const maybeParsed = tryParseJSON(mpRaw?.message); // por si message viene como JSON string

      const mpDetail =
        typeof maybeParsed === "object" && maybeParsed !== null
          ? maybeParsed
          : mpRaw;

      return res.status(error.response.status || 500).json({
        error: "Error al obtener sucursales",
        status: error.response.status,
        detalle: mpDetail, // ahora debería ser objeto limpio
        hints: [
          "Verificá que el header Authorization sea 'Bearer <token>' sin comillas extras.",
          "Asegurate de no enviar el token envuelto en JSON como string.",
          "Chequeá que el token no esté truncado y que pertenezca al mismo userId.",
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
  const token = getTokenFromRequest(req);
  const userId = getUserIdFromRequest(req);

  const storeData = req.body;

  if (!token || !userId) {
    return res
      .status(400)
      .json({ error: "Token o userId no disponible en memoria." });
  }

  try {
    const response = await axios.post(
      `https://api.mercadopago.com/users/${userId}/stores`,
      storeData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json(response.data);
  } catch (error: any) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Detalles del error:",
        error.response?.data || error.message
      );
      return res
        .status(500)
        .json({ error: error.response?.data || "Error desconocido" });
    } else {
      console.error("Error inesperado:", error);
      return res
        .status(500)
        .json({ error: "Error inesperado al crear la sucursal" });
    }
  }
};
