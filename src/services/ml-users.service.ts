import axios from "axios";
import { resolveTokenByUserId } from "../utils/resolveByUserId";

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
 * Para webhooks: intenta resolver token por user_id desde el caché.
 * - Si hay token, lo usa.
 * - Si no hay token, hace request pública (sin Authorization) para datos básicos.
 */
export async function fetchMlUser(userId: number): Promise<MlUser | null> {
  const token = resolveTokenByUserId(String(userId)); // puede ser undefined

  const url = `https://api.mercadolibre.com/users/${userId}`;
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  try {
    const { data, status } = await axios.get(url, { headers, timeout: 8000 });
    if (status === 200 && data) return data as MlUser;
    if (status === 404) return null;
    throw new Error(`Unexpected status ${status}`);
  } catch (err: any) {
    // Si intentamos sin token y recibimos 401/403, solo logueá; no tenemos _e/_m acá para refrescar
    const st = err?.response?.status;
    if (!token && (st === 401 || st === 403)) {
      // Log suave: sin token aún (no se precalentó cache), y el endpoint pidió auth
      // Podés decidir retornar null o relanzar; prefiero null para no romper el flujo del webhook.
      return null;
    }
    // Otros errores sí se propagan
    throw new Error(
      `Error al consultar usuario ${userId}: ${st || ""} ${err?.message || err}`
    );
  }
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