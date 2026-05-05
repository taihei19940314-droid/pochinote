-- ================================================================
-- Pochinote — ロール権限付与
-- 作成日: 2026-05-05
-- 説明: PostgreSQL ロールへのテーブルアクセス権を付与する
--
-- Supabase には3つのロールがある:
--   anon        → 未ログインのブラウザ（RLS で行レベル制御）
--   authenticated → ログイン済みユーザー（RLS で行レベル制御）
--   service_role  → サーバーサイド管理者（RLS をバイパス）
--
-- RLS ポリシーだけでは不十分で、PostgreSQL の GRANT も必要。
-- ================================================================

-- service_role: サーバーサイド管理クライアントが全テーブルを操作できるようにする
GRANT ALL ON ALL TABLES   IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- authenticated: ログイン済みスタッフが操作できるようにする（行はRLSで制御）
GRANT ALL ON ALL TABLES   IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- anon: 今後パブリックな読み取りが必要になったときのために最小限だけ付与
-- 現時点では全テーブルがRLS保護のため、付与しても実害なし
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
