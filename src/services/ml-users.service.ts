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
