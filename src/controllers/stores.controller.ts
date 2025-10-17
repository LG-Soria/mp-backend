import { Request, Response } from "express";
import axios from "axios";
import { getTokenFromRequest } from "../utils/getAuthToken";
import { getUserIdFromRequest } from "../utils/getUserId";

export const getStores = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const token = getTokenFromRequest(req);
  console.log("userId desde params:", userId);
  console.log("token desde params:", token);

  if (!token || !userId) {
    return res.status(400).json({ error: "token y userId son requeridos" });
  }

  try {
    const response = await axios.get(
      `https://api.mercadopago.com/users/${userId}/stores/search`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.json({ sucursales: response.data.results });
  } catch (error: any) {
    console.error("Error al obtener sucursales:", error);

    // Si es un error de Axios, mostrar detalle completo
    if (error.response) {
      console.error("🟥 Respuesta de Mercado Pago:", error.response.data);
      return res.status(error.response.status || 500).json({
        error: "Error al obtener sucursales",
        detalle: error.response.data, // detalle de Mercado Pago
        status: error.response.status,
      });
    }

    // Si es un error en la request (no llegó al servidor)
    if (error.request) {
      console.error("🟧 No se recibió respuesta:", error.request);
      return res.status(500).json({
        error: "No se recibió respuesta de Mercado Pago",
        detalle: error.request,
      });
    }

    // Otro tipo de error
    console.error("🟨 Error inesperado:", error.message);
    return res.status(500).json({
      error: "Error inesperado al obtener sucursales",
      detalle: error.message,
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
