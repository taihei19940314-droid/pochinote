import { getResend } from './resend';

export async function sendBetaSignupNotification(email: string) {
  const now = new Date();
  const jstShifted = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const timestamp = jstShifted.toISOString().replace('T', ' ').slice(0, 16);

  try {
    await getResend().emails.send({
      from: 'onboarding@resend.dev',
      to: 'triel.kobayashi@gmail.com',
      subject: `【トリエル】新規申し込み: ${email}`,
      text: `トリエルへの新規申し込みがありました。

━━━━━━━━━━━━━━━━━━━━━━
申し込み者メールアドレス: ${email}
申し込み日時: ${timestamp} JST
━━━━━━━━━━━━━━━━━━━━━━

48時間以内に手動で返信してください。
返信テンプレートは別途用意してあります。`,
    });
    return { success: true };
  } catch (error) {
    console.error('[sendBetaSignupNotification] failed:', error);
    return { success: false, error };
  }
}
