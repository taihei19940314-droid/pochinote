import { createClient } from "@supabase/supabase-js";

// Service Role Key を使う管理者クライアント。
// RLS をバイパスするため、サーバーサイド専用。
// クライアントコンポーネントや NEXT_PUBLIC_ 変数では絶対に使わないこと。
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY が .env.local に設定されていません"
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
