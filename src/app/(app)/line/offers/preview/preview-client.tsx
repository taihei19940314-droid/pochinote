"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { InactiveCustomer } from "@/lib/inactive-customers";

export type SlotInfo = {
  dateLabel: string;  // 「今日」「明日」「M/D(曜)」
  startHHMM: string;
  endHHMM: string;
  slotCount: number;
};

export type EmptySummary = {
  totalLinkedCustomers: number;
  customersWithoutVisitHistory: number;
  inactiveThresholdDays: number;
};

// ─── 空き枠カード ───────────────────────────────────────────
function SlotInfoCard({ slot }: { slot: SlotInfo }) {
  return (
    <div
      className="card p-4 mb-6"
      style={{ borderLeft: "3px solid var(--terra)" }}
    >
      <div
        className="text-[10px] tracking-[0.18em] uppercase mb-1 font-semibold"
        style={{ color: "var(--terra)" }}
      >
        対象の空き枠
      </div>
      <div className="font-semibold text-base">
        {slot.dateLabel}&nbsp;
        {slot.startHHMM}〜{slot.endHHMM}
      </div>
      <div className="text-sm mt-0.5" style={{ color: "var(--ink-soft)" }}>
        {slot.slotCount}枠分の空きがあります
      </div>
    </div>
  );
}

// ─── 0件時サマリー ──────────────────────────────────────────
function EmptySummarySection({ summary }: { summary: EmptySummary }) {
  return (
    <div className="card p-8 text-center">
      <div className="text-3xl mb-4">🎉</div>
      <div className="font-semibold mb-2">離脱気味のお客様はいません</div>
      <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--ink-soft)" }}>
        全員が{summary.inactiveThresholdDays}日以内にご来店されています。
      </p>

      <div
        className="rounded-xl p-4 text-left space-y-2"
        style={{ background: "rgba(26,26,46,0.04)" }}
      >
        <div className="text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>
          サロンの状況
        </div>
        <SummaryRow
          label="LINE 連携済み顧客"
          value={`${summary.totalLinkedCustomers}人`}
        />
        <SummaryRow
          label={`離脱判定`}
          value={`最終来店から ${summary.inactiveThresholdDays}日以上経過`}
        />
        <SummaryRow
          label="来店記録のない顧客"
          value={`${summary.customersWithoutVisitHistory}人（対象外）`}
        />
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span style={{ color: "var(--ink-soft)" }}>{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

// ─── メインクライアント島 ───────────────────────────────────
export function PreviewClient({
  candidates,
  slotInfo,
  emptySummary,
}: {
  candidates: InactiveCustomer[];
  slotInfo?: SlotInfo;
  emptySummary: EmptySummary;
}) {
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(candidates.map((c) => c.customerId))
  );

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const checkedCount = checked.size;

  return (
    <>
      {slotInfo && <SlotInfoCard slot={slotInfo} />}

      {candidates.length === 0 ? (
        <EmptySummarySection summary={emptySummary} />
      ) : (
        <div className="flex flex-col gap-3 pb-24 lg:pb-16">
          {candidates.map((c) => (
            <label
              key={c.customerId}
              className="card p-4 flex items-start gap-3 cursor-pointer"
            >
              <Checkbox
                checked={checked.has(c.customerId)}
                onCheckedChange={() => toggle(c.customerId)}
                className="mt-0.5 shrink-0 data-checked:bg-[var(--terra)] data-checked:border-[var(--terra)]"
              />
              <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{c.customerName}</div>
                  <div className="text-sm mt-0.5" style={{ color: "var(--ink-soft)" }}>
                    {c.petName}
                    {c.petBreed ? `（${c.petBreed}）` : ""}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className="text-lg font-bold tabular-nums"
                    style={{ color: "var(--sage)" }}
                  >
                    {c.daysSinceLastVisit}日
                  </div>
                  <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
                    最終来店 {formatLastVisit(c.lastVisitAt)}
                  </div>
                </div>
              </div>
            </label>
          ))}

          <p className="text-xs text-center mt-1" style={{ color: "var(--ink-soft)" }}>
            {candidates.length}件
          </p>
        </div>
      )}

      {/* sticky フッター — 候補がある場合のみ表示 */}
      {candidates.length > 0 && (
        <div
          className="fixed left-0 right-0 z-40 lg:left-64"
          style={{
            bottom: 0,
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {/* モバイル: BottomTab(56px)分を上に積む */}
          <div className="lg:hidden" style={{ height: 56 }} />
          <div
            className="px-4 py-3 flex items-center justify-between gap-4 border-t"
            style={{
              background: "rgba(250,247,242,0.92)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              borderColor: "rgba(26,26,46,0.1)",
            }}
          >
            <span className="text-sm font-medium" style={{ color: "var(--ink-soft)" }}>
              <span className="font-bold" style={{ color: "var(--ink)" }}>{checkedCount}人</span>
              を選択中 / {candidates.length}人
            </span>
            {/* Week 3 で onClick を追加する */}
            <button
              disabled
              className="px-5 py-2 rounded-lg text-sm font-semibold cursor-not-allowed"
              style={{
                background: "rgba(26,26,46,0.1)",
                color: "rgba(26,26,46,0.35)",
              }}
            >
              送信
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── 日付フォーマット ────────────────────────────────────────
const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function formatLastVisit(date: Date): string {
  const jst = new Date(date.getTime() + 9 * 3600_000);
  const M = jst.getUTCMonth() + 1;
  const D = jst.getUTCDate();
  const w = WEEKDAY_LABELS[jst.getUTCDay()];
  return `${M}/${D}(${w})`;
}
