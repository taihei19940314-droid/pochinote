"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import CustomersList, { type CustomerRow } from "./customers-list";

export interface PendingRow {
  id: string;
  name: string;
  line_follow_status: string | null;
  line_followed_at: string | null;
}

type Tab = "customers" | "line_pending";

function TabsInner({
  identified,
  pending,
  inactiveThresholdDays,
}: {
  identified: CustomerRow[];
  pending: PendingRow[];
  inactiveThresholdDays: number;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tab = (searchParams.get("tab") ?? "customers") as Tab;

  function setTab(t: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", t);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <>
      {/* タブバー */}
      <div className="flex gap-2 mb-4 px-1 lg:px-0">
        <button
          onClick={() => setTab("customers")}
          className="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0"
          style={
            tab === "customers"
              ? { background: "var(--terra)", color: "white" }
              : { background: "rgba(26,26,46,0.06)", color: "var(--ink-soft)" }
          }
        >
          お客様
          <span className="ml-1.5 opacity-70 text-xs">{identified.length}</span>
        </button>

        {/* 未特定が0件のときはタブ非表示 */}
        {pending.length > 0 && (
          <button
            onClick={() => setTab("line_pending")}
            className="px-4 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-1.5"
            style={
              tab === "line_pending"
                ? { background: "var(--terra)", color: "white" }
                : { background: "rgba(26,26,46,0.06)", color: "var(--ink-soft)" }
            }
          >
            LINE 新規
            <span
              className="inline-flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 min-w-[18px] h-[18px]"
              style={
                tab === "line_pending"
                  ? { background: "rgba(255,255,255,0.3)", color: "white" }
                  : { background: "var(--terra)", color: "white" }
              }
            >
              {pending.length}
            </span>
          </button>
        )}
      </div>

      {/* タブコンテンツ */}
      {tab === "customers" ? (
        <CustomersList customers={identified} inactiveThresholdDays={inactiveThresholdDays} />
      ) : (
        <PendingList pending={pending} />
      )}
    </>
  );
}

function PendingList({ pending }: { pending: PendingRow[] }) {
  if (pending.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="text-4xl mb-4">✅</div>
        <p className="text-sm" style={{ color: "var(--ink-soft)" }}>
          紐付け待ちの LINE ユーザーはいません
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-1 lg:px-0">
      {pending.map((p) => {
        const followedAt = p.line_followed_at
          ? new Date(p.line_followed_at).toLocaleDateString("ja-JP", {
              timeZone: "Asia/Tokyo",
              month: "2-digit",
              day: "2-digit",
            })
          : null;

        return (
          <a
            key={p.id}
            href={`/line/pending-matches`}
            className="card p-4 lg:p-5 flex items-center gap-4 cursor-pointer transition-all hover:shadow-md"
            style={{ borderLeft: "3px solid var(--terra)" }}
          >
            <div
              className="text-2xl w-12 h-12 flex items-center justify-center rounded-full flex-shrink-0"
              style={{ background: "rgba(201,123,95,0.12)" }}
            >
              💬
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-base">紐付け待ち</div>
            </div>
            <div className="text-right flex-shrink-0">
              {followedAt && (
                <div className="text-xs" style={{ color: "var(--ink-soft)" }}>
                  {followedAt} 友だち追加
                </div>
              )}
              <div
                className="text-xs font-semibold mt-0.5"
                style={{ color: "var(--terra)" }}
              >
                紐付け →
              </div>
            </div>
          </a>
        );
      })}
    </div>
  );
}

export function CustomersTabs({
  identified,
  pending,
  inactiveThresholdDays,
}: {
  identified: CustomerRow[];
  pending: PendingRow[];
  inactiveThresholdDays: number;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex gap-2 mb-4 px-1 lg:px-0">
          <div
            className="px-4 py-1.5 rounded-full text-sm font-semibold"
            style={{ background: "var(--terra)", color: "white" }}
          >
            お客様
          </div>
        </div>
      }
    >
      <TabsInner identified={identified} pending={pending} inactiveThresholdDays={inactiveThresholdDays} />
    </Suspense>
  );
}
