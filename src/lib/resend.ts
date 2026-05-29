import { Resend } from 'resend';

// Lazily instantiated so missing env var doesn't crash the build
let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY ?? 'missing');
  }
  return _resend;
}
