export type MpWebhookType =
  | "payment"
  | "merchant_order"
  | "mp-connect"
  | string; // extensible

export interface MpWebhookBody {
  id?: string;                     // algunos eventos lo incluyen
  user_id?: number;                // mp-connect lo incluye
  type?: MpWebhookType;            // p.ej. "mp-connect", "payment"
  action?: string;                 // p.ej. "application.authorized"
  api_version?: string;            // "v1"
  live_mode?: boolean;
  date_created?: string;
  data?: { id?: string } | null;   // en payment suele venir el id acá
}

export interface MpWebhookMeta {
  xRequestId: string;
  receivedAt: string;
  rawQuery: Record<string, any>;
  rawHeaders: Record<string, any>;
  // opcionales
  type?: string;
  action?: string;
}