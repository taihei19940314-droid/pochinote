import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function LineTemplatesPage() {
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

      <h1 className="font-display text-2xl font-semibold tracking-tight mb-6">メッセージテンプレート</h1>

      <div className="card p-8 text-center">
        <div className="text-3xl mb-4">✉️</div>
        <div className="font-semibold mb-2">準備中</div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          フレンドリー型・業務的型・営業的型の3パターンを、サロンの雰囲気に
          合わせて編集できます。現在開発中です。
        </p>
      </div>
    </div>
  );
}
