import Link from "next/link";
import { ChevronRight, Smartphone } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight mb-1">ヘルプ</h1>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>使い方・デモ・よくある質問</p>
      </div>

      <div className="space-y-3">
        <Link
          href="/help/line-demo"
          className="card p-4 flex items-center gap-4 transition-all hover:shadow-md active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(217,119,87,0.1)" }}>
            <Smartphone size={20} style={{ color: "var(--terra)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm mb-0.5">飼い主側の体験を見る</div>
            <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
              LINE でオファーが届いたときの、飼い主側の画面イメージ
            </div>
          </div>
          <ChevronRight size={18} style={{ color: "var(--ink-soft)" }} className="flex-shrink-0" />
        </Link>
      </div>
    </div>
  );
}
