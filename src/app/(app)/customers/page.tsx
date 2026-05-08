import Link from "next/link";
import { customers } from "@/lib/mock-customers";

export default function CustomersPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-2">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">顧客カルテ</h1>
        <button className="px-4 py-2 rounded-lg text-sm font-semibold" style={{ background: "var(--terra)", color: "white" }}>
          + 新規追加
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="飼い主名・ペット名で検索..."
          className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
          style={{ borderColor: "rgba(26,26,46,0.12)", background: "white", color: "var(--ink)" }}
          readOnly
        />
      </div>

      {/* Customer list */}
      <div className="space-y-3">
        {customers.map((c) => {
          const urgency = c.lastVisitDaysAgo >= 60;
          return (
            <Link key={c.id} href={`/customers/${c.id}`}>
              <div
                className="card p-5 flex items-center gap-4 cursor-pointer transition-all hover:shadow-md"
                style={{ borderLeft: `3px solid ${urgency ? "var(--terra)" : "transparent"}` }}
              >
                <div className="text-3xl w-12 h-12 flex items-center justify-center rounded-full flex-shrink-0"
                  style={{ background: "var(--paper-warm)" }}>
                  {c.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-sm">{c.petName}</span>
                    <span className="text-xs" style={{ color: "var(--ink-soft)" }}>/ {c.breed} {c.sex} {c.age}y</span>
                    {c.flags.length > 0 && (
                      <span className="pill text-[10px]" style={{ background: "rgba(200,155,60,0.15)", color: "var(--gold)" }}>
                        ⚠ {c.flags[0]}
                      </span>
                    )}
                  </div>
                  <div className="text-xs" style={{ color: "var(--ink-soft)" }}>{c.ownerName}</div>
                </div>
                <div className="text-right flex-shrink-0 space-y-1">
                  <div className="text-xs font-mono" style={{ color: urgency ? "var(--terra)" : "var(--ink-soft)" }}>
                    {c.lastVisitDaysAgo}日前
                  </div>
                  <div className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>{c.visitCount}回来店</div>
                  <div className="text-xs font-mono font-semibold" style={{ color: "var(--ink)" }}>¥{c.regularPrice.toLocaleString()}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
