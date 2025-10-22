import axios from "axios";
import { getAuthToken } from "../utils/getAuthToken";

export interface MlUser {
  id: number;
  nickname?: string;
  first_name?: string;
  last_name?: string;
  business_name?: string;
  email?: string;
  site_id?: string;
  registration_date?: string;
}

/**
 * Obtiene información del usuario desde la API de Mercado Libre (o Mercado Pago).
 * Usa el token de aplicación para autenticarse.
 */
export async function fetchMlUser(userId: number): Promise<MlUser | null> {
  const token = await getAuthToken(); // ✅ tu token válido de app/seller
  const url = `https://api.mercadolibre.com/users/${userId}`; // API válida para obtener perfil público del usuario
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error al consultar usuario ${userId}: ${res.status} - ${text}`);
  }

  return (await res.json()) as MlUser;
}


export interface ObtenerTokenParams {
  empresa: string; // _e
  modo: "homo" | "prod"; // _m
  app: string; // _a
}

/** Respuesta mínima al frontend */
export interface UserInfoResult {
  ok: true;
  userId: number;
  displayName: string;
  nickname: string | null;
}

/** Error estándar hacia controlador */
export class MlUsersError extends Error {
  code?: string | number;
  constructor(message: string, code?: string | number) {
    super(message);
    this.code = code;
  }
}

/** Construye URL a PHP con _i JSON-encoded */
function buildPhpTokenUrl(params: ObtenerTokenParams): string {
  const base = "https://apiphp.novagestion.com.ar/apinovades/mercadopago/obtenerMercadoToken.php";
  const i = encodeURIComponent(JSON.stringify({ _e: params.empresa, _m: params.modo, _a: params.app }));
  return `${base}?_i=${i}`;
}

/** Llama al PHP para obtener access_token + user_id */
async function obtenerTokenDesdePHP(params: ObtenerTokenParams) {
  const url = buildPhpTokenUrl(params);
  const { data } = await axios.get(url, { timeout: 10000 });

  if (!data || data.status !== "success" || !data.data?.access_token || !data.data?.user_id) {
    throw new MlUsersError("mp_token_unavailable", 502);
  }

  return {
    accessToken: String(data.data.access_token),
    userId: Number(data.data.user_id),
  };
}

/** Llama a Mercado Libre /users/{id} con Bearer y arma displayName */
async function obtenerPerfilML(userId: number, accessToken: string) {
  const url = `https://api.mercadolibre.com/users/${userId}`;
  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    timeout: 8000,
  });

  const nickname = data?.nickname ?? null;
  const first = data?.first_name ? String(data.first_name).trim() : "";
  const last = data?.last_name ? String(data.last_name).trim() : "";
  const displayName = (first || last) ? `${first}${last ? " " + last : ""}`.trim() : (nickname ?? `Usuario ${userId}`);

  return { userId, displayName, nickname };
}

/** Cache en memoria opcional para reducir golpes a ML (TTL 120s) */
const cache = new Map<number, { value: { userId: number; displayName: string; nickname: string | null }; exp: number }>();
const TTL_MS = 120_000;

/** Servicio principal: obtiene token del PHP, llama a ML y retorna datos mínimos */
export async function fetchUserInfoByBusinessParams(params: ObtenerTokenParams): Promise<UserInfoResult> {
  const token = await obtenerTokenDesdePHP(params);

  const cached = cache.get(token.userId);
  const now = Date.now();
  if (cached && cached.exp > now) {
    return { ok: true, ...cached.value };
  }

  const prof = await obtenerPerfilML(token.userId, token.accessToken);
  cache.set(token.userId, { value: prof, exp: now + TTL_MS });
  return { ok: true, ...prof };
}

/** Solo DEV: usa userId + accessToken provistos (no usar en prod) */
export async function fetchUserInfoByTokenDev(userId: number, accessToken: string): Promise<UserInfoResult> {
  const prof = await obtenerPerfilML(userId, accessToken);
  return { ok: true, ...prof };
}