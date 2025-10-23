// src/utils/mpCache.ts
type MpCached = {
  access_token: string;
  user_id: string;
  exp: number;
  source: "php" | "me";
  empresa: string;
  modo: string;
};

const byKey = new Map<string, MpCached>();          // clave: empresa:modo
const byUserId = new Map<string, MpCached[]>();     // clave: user_id → entries (puede haber varias empresas/modos)

function keyOf(e: string, m: string) {
  return `${e}:${m}`.trim();
}

export function setMpCache(
  empresa: string,
  modo: string,
  data: Omit<MpCached, "empresa" | "modo" | "source">,
  source: MpCached["source"] = "php"
) {
  const entry: MpCached = { ...data, source, empresa, modo };
  const k = keyOf(empresa, modo);

  byKey.set(k, entry);

  // Indexar por user_id
  const list = byUserId.get(entry.user_id) || [];
  // Reemplazar si ya existe misma (empresa, modo), si no, push
  const idx = list.findIndex(x => x.empresa === empresa && x.modo === modo);
  if (idx >= 0) list[idx] = entry;
  else list.push(entry);
  byUserId.set(entry.user_id, list);
}

export function getMpCache(e: string, m: string): MpCached | undefined {
  return byKey.get(keyOf(e, m));
}

export function getMpCacheByUserId(user_id: string): MpCached[] {
  return byUserId.get(String(user_id)) || [];
}

export function isExpired(entry?: MpCached): boolean {
  if (!entry) return true;
  return Date.now() >= entry.exp;
}

/** Devuelve el primer token válido (no expirado) para un user_id */
export function getValidTokenByUserId(user_id: string): MpCached | undefined {
  const list = getMpCacheByUserId(user_id).filter(e => !isExpired(e));
  // Heurística simple: tomar el más “largo” (por si conviven apps) o el más nuevo
  // Acá elegimos el más nuevo por exp descendente:
  list.sort((a, b) => b.exp - a.exp);
  return list[0];
}
