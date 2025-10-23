import { MpWebhookMeta } from "../types/mp-webhook";


// utils/extractUserId.ts
export function extractUserId(meta: MpWebhookMeta, body?: any): string | undefined {
  // 1) lo más común en payment: viene en el body a nivel raíz
  const fromBody = body?.user_id;

  // 2) por si lo mandás en query (pruebas manuales)
  const fromQuery = meta.rawQuery?.user_id;

  // 3) por si algún proxy lo pone en headers
  const fromHeaders =
    meta.rawHeaders?.["x-user-id"] ??
    meta.rawHeaders?.["x-meli-user-id"] ??
    meta.rawHeaders?.["x-mp-user-id"];

  const uid = fromBody ?? fromQuery ?? fromHeaders;
  return uid != null ? String(uid) : undefined;
}
