import { createHmac, timingSafeEqual } from "crypto";

export function verifyLineSignature(
  body: string,
  signature: string,
  channelSecret: string
): boolean {
  const digest = createHmac("sha256", channelSecret)
    .update(body)
    .digest("base64");

  try {
    const digestBuf = Buffer.from(digest);
    const sigBuf = Buffer.from(signature);
    // timingSafeEqual はバッファ長が同じ必要がある
    if (digestBuf.length !== sigBuf.length) return false;
    return timingSafeEqual(digestBuf, sigBuf);
  } catch {
    return false;
  }
}
