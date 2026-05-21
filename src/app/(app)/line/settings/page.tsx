import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function LineSettingsPage() {
  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/line"
        className="inline-flex items-center gap-1 text-sm mb-6 transition-opacity hover:opacity-70"
        style={{ color: "var(--ink-soft)" }}
      >
        <ChevronLeft size={16} />
        LINE メニューに戻る
      </Link>

      <h1 className="font-display text-2xl font-semibold tracking-tight mb-6">LINE 連携設定</h1>

      <div className="card p-8 text-center">
        <div className="text-3xl mb-4">🔧</div>
        <div className="font-semibold mb-2">準備中</div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          公式アカウントの接続情報と、自動オファーの基本設定をここで管理します。
          現在開発中です。
        </p>
      </div>
    </div>
  );
}
