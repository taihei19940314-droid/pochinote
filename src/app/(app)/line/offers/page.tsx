import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function LineOffersPage() {
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

      <h1 className="font-display text-2xl font-semibold tracking-tight mb-6">オファー候補</h1>

      <div className="flex flex-col gap-3">
        <Link
          href="/line/offers/preview"
          className="card p-4 flex items-center justify-between gap-3 transition-opacity hover:opacity-80"
        >
          <div>
            <div className="font-semibold">離脱気味のお客様を確認</div>
            <div className="text-sm mt-0.5" style={{ color: "var(--ink-soft)" }}>
              一定期間ご来店のない LINE 登録済みのお客様一覧
            </div>
          </div>
          <ChevronRight size={18} style={{ color: "var(--ink-soft)", flexShrink: 0 }} />
        </Link>
      </div>
    </div>
  );
}
