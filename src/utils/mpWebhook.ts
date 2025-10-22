import crypto from "crypto";

/**
 * Extrae ts y v1 del header x-signature.
 * Formato esperado: "ts=1699999999, v1=abcdef..."
 */
export function parseSignatureHeader(signatureHeader: string) {
  const parts = (signatureHeader || "").split(",");
  const out: Record<string, string> = {};
  for (const p of parts) {
    const [k, v] = p.split("=").map((s) => s?.trim());
    if (k && v) out[k] = v;
  }
  return { ts: out["ts"], v1: out["v1"] };
}

/**
 * Arma el manifest según docs: id:{id};request-id:{reqId};ts:{ts};
 */
export function buildManifest(params: { id: string; requestId: string; ts: string }) {
  return `id:${params.id};request-id:${params.requestId};ts:${params.ts};`;
}

/**
 * Verifica la firma HMAC-SHA256 (v1) usando la Webhook Secret.
 */
export function verifyMpSignature(args: {
  signatureHeader: string;
  requestId: string;
  id: string;
  secret: string;
}) {
  const { ts, v1 } = parseSignatureHeader(args.signatureHeader);
  if (!ts || !v1 || !args.requestId || !args.id || !args.secret) return false;

  const manifest = buildManifest({ id: args.id, requestId: args.requestId, ts });
  const hash = crypto.createHmac("sha256", args.secret).update(manifest).digest("hex");
  return hash === v1;
}
