import { Request, Response } from "express";
import axios from "axios";

let mpToken: string | null = null;
let mpUserId: string | null = null;

export const getTokenFromPHP = async (req: Request, res: Response) => {
  try {
    const { _e, _m } = req.query;

    if (!_e || !_m) {
      return res.status(400).json({ error: "Faltan parámetros: _e o _m" });
    }

    const payload = JSON.stringify({
      _e,
      _m,
      _a: "3",
    });

    const phpUrl = `https://apiphp.novagestion.com.ar/apinovades/mercadopago/obtenerMercadoToken.php?_i=${encodeURIComponent(
      payload
    )}`;

    const response = await axios.get(phpUrl);
    const data = response.data;

    if (!data?.data?.access_token || !data?.data?.user_id) {
      return res
        .status(500)
        .json({ error: "Token o user_id faltantes en la respuesta" });
    }

    mpToken = data.data.access_token;
    mpUserId = data.data.user_id;

    return res.status(200).json({
      message: "Token y User ID obtenidos correctamente",
      token: mpToken,
      user_id: mpUserId,
    });
  } catch (error: any) {
    console.error(
      "Error al crear la orden:",
      error.response?.data || error.message
    );
    return res.status(error.response?.status || 500).json({
      error: error.response?.data || "Error al crear la orden en Mercado Pago",
    });
  }
};

export const getStoredToken = () => mpToken;
export const getStoredUserId = () => mpUserId;
