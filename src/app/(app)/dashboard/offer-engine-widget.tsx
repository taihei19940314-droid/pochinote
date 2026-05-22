"use client";

import { useState } from "react";
import Link from "next/link";
import type { AvailableSlot } from "@/lib/availability";

type DetectState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; slots: AvailableSlot[] }
  | { status: "error" };

function formatJstHHMM(iso: string): string {
  const jst = new Date(new Date(iso).getTime() + 9 * 60 * 60 * 1000);
  return `${String(jst.getUTCHours()).padStart(2, "0")}:${String(jst.getUTCMinutes()).padStart(2, "0")}`;
}

function formatDateLabel(dateStr: string): string {
  // dateStr: "YYYY-MM-DD" (JST)
  const now = new Date();
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const todayJst = `${jstNow.getUTCFullYear()}-${String(jstNow.getUTCMonth() + 1).padStart(2, "0")}-${String(jstNow.getUTCDate()).padStart(2, "0")}`;
  const tomorrowDate = new Date(jstNow.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowJst = `${tomorrowDate.getUTCFullYear()}-${String(tomorrowDate.getUTCMonth() + 1).padStart(2, "0")}-${String(tomorrowDate.getUTCDate()).padStart(2, "0")}`;

  if (dateStr === todayJst) return "今日";
  if (dateStr === tomorrowJst) return "明日";

  const [, m, d] = dateStr.split("-").map(Number);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const day = new Date(Date.UTC(Number(dateStr.slice(0, 4)), m - 1, d)).getUTCDay();
  return `${m}/${d}(${weekdays[day]})`;
}

function SlotCard({ slot }: { slot: AvailableSlot }) {
  const dateLabel = formatDateLabel(slot.date);
  const startHHMM = formatJstHHMM(slot.start);
  const endHHMM = formatJstHHMM(slot.end);

  return (
    <div
      className="p-3 rounded-lg"
      style={{ background: "rgba(250,247,242,0.07)" }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <span
            className="text-[10px] font-semibold tracking-wider uppercase mr-2"
            style={{ color: "var(--terra)" }}
          >
            {dateLabel}
          </span>
          <span className="font-mono text-sm font-semibold" style={{ color: "rgba(250,247,242,0.95)" }}>
            {startHHMM} 〜 {endHHMM}
          </span>
        </div>
        <span
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
          style={{ background: "rgba(217,119,87,0.25)", color: "var(--terra)" }}
        >
          {slot.slot_count}枠分
        </span>
      </div>
      <button
        disabled
        className="w-full py-2 rounded-lg text-xs font-semibold tracking-wide cursor-not-allowed"
        style={{
          background: "rgba(250,247,242,0.06)",
          color: "rgba(250,247,242,0.3)",
        }}
      >
        オファー候補を見る（準備中）
      </button>
    </div>
  );
}

export function OfferEngineWidget() {
  const [state, setState] = useState<DetectState>({ status: "idle" });

  async function detect() {
    setState({ status: "loading" });
    try {
      const res = await fetch("/api/offers/detect", { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json() as { slots: AvailableSlot[] };
      setState({ status: "done", slots: data.slots });
    } catch {
      setState({ status: "error" });
    }
  }

  return (
    <div
      className="card p-5 lg:p-6 relative overflow-hidden"
      style={{ background: "var(--ink)", color: "var(--paper)" }}
    >
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div
            className="text-[10px] tracking-[0.2em] uppercase mb-1"
            style={{ opacity: 0.5 }}
          >
            Auto Offer Engine
          </div>
          <h2 className="font-display text-lg lg:text-xl font-semibold tracking-tight">
            空き枠の<br />
            <span style={{ color: "var(--terra)" }}>自動セールス</span>
          </h2>
        </div>
      </div>

      {/* 説明文 */}
      <div className="text-xs mb-4 leading-relaxed" style={{ opacity: 0.55 }}>
        空き枠が出ると、条件にあう常連さんへ LINE で自動オファーを配信します。
      </div>

      {/* 状態別コンテンツ */}
      {state.status === "idle" && (
        <button
          onClick={detect}
          className="w-full py-3 rounded-lg text-sm font-semibold tracking-wide transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{ background: "var(--terra)", color: "white" }}
        >
          空き枠を確認
        </button>
      )}

      {state.status === "loading" && (
        <div
          className="py-4 text-center text-xs font-semibold tracking-wider"
          style={{ color: "rgba(250,247,242,0.5)" }}
        >
          検出中...
        </div>
      )}

      {state.status === "error" && (
        <div className="space-y-3">
          <p
            className="text-xs text-center"
            style={{ color: "rgba(250,247,242,0.55)" }}
          >
            検出に失敗しました。もう一度お試しください。
          </p>
          <button
            onClick={detect}
            className="w-full py-2.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90"
            style={{ background: "rgba(250,247,242,0.1)", color: "rgba(250,247,242,0.8)" }}
          >
            再試行
          </button>
        </div>
      )}

      {state.status === "done" && (
        <div className="space-y-3">
          {state.slots.length === 0 ? (
            <div className="py-3 text-center space-y-1">
              <p className="text-xs font-semibold" style={{ color: "rgba(250,247,242,0.7)" }}>
                現在検出可能な空き枠はありません
              </p>
              <p className="text-[10px]" style={{ color: "rgba(250,247,242,0.35)" }}>
                営業時間外、定休日、または全枠が埋まっている可能性があります
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {state.slots.map((slot, i) => (
                <SlotCard key={i} slot={slot} />
              ))}
            </div>
          )}
          <button
            onClick={detect}
            className="w-full py-2 rounded-lg text-[10px] font-semibold tracking-wider uppercase transition-opacity hover:opacity-80"
            style={{ background: "rgba(250,247,242,0.06)", color: "rgba(250,247,242,0.4)" }}
          >
            再検出
          </button>
        </div>
      )}

      {/* LINE 管理リンク */}
      <Link
        href="/line"
        className="mt-3 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-opacity hover:opacity-90 active:scale-[0.98]"
        style={{ background: "rgba(250,247,242,0.08)", color: "rgba(250,247,242,0.65)" }}
      >
        LINE オファー管理を開く
      </Link>
    </div>
  );
}
