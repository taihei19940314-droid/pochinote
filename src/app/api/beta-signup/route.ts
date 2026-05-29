import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { sendBetaSignupNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  let email: string;
  try {
    const body = await request.json();
    email = body.email?.trim().toLowerCase();
    if (!email) return NextResponse.json({ error: 'email_required' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from('beta_signups').insert({ email });

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'duplicate' }, { status: 409 });
    }
    console.error('[beta-signup] supabase error:', error);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }

  // Supabase insert 成功後にメール通知。失敗しても申し込み自体は成功とする
  const notifResult = await sendBetaSignupNotification(email);
  if (!notifResult.success) {
    console.warn('[beta-signup] notification failed but signup succeeded for:', email);
  }

  return NextResponse.json({ ok: true });
}
