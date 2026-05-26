"use client";

import { useOptimistic, useTransition, useState } from "react";
import Link from "next/link";
import { approveBookingRequest, declineBookingRequest } from "./actions";

export type PendingRecipient = {
  id: string;
  offerId: string;
  bookedAt: string;
  customerName: string;
  petName: string;
  petBreed: string | null;
  slotDateLabel: string;
  slotStartHHMM: string;
  competingCount: number;
};

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes}分前に予約希望`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}時間前に予約希望`;
  return `${Math.floor(hours / 24)}日前に予約希望`;
}

type Toast =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | null;

function ToastBanner({ toast }: { toast: Toast }) {
  if (!toast) return null;
  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg"
      style={{
        background: toast.type === "success" ? "var(--sage)" : "#c0392b",
        color: "white",
        maxWidth: "90vw",
      }}
    >
      {toast.message}
    </div>
  );
}

function RecipientCard({
  recipient,
  onApprove,
  onDecline,
  busy,
}: {
  recipient: PendingRecipient;
  onApprove: () => void;
  onDecline: () => void;
  busy: boolean;
}) {
  return (
    <div className="card p-4" style={{ borderLeft: "3px solid var(--terra)" }}>
      {/* 競合警告 */}
      {recipient.competingCount > 0 && (
        <div
          className="mb-3 px-3 py-2 rounded-lg text-xs font-semibold"
          style={{ background: "rgba(200,155,60,0.15)", color: "var(--gold)" }}
        >
          ⚠️ この空き枠には他に{recipient.competingCount}件の予約希望があります。1人を承認すると他は手動で却下してください。
        </div>
      )}

      {/* 空き枠日時 */}
      <div className="text-xs font-semibold mb-2" style={{ color: "var(--terra)" }}>
        {recipient.slotDateLabel} {recipient.slotStartHHMM}〜
      </div>

      {/* 顧客・ペット */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-semibold text-base">{recipient.customerName}</div>
          <div className="text-sm mt-0.5" style={{ color: "var(--ink-soft)" }}>
            {recipient.petName}
            {recipient.petBreed ? `（${recipient.petBreed}）` : ""}
          </div>
        </div>
        <div className="text-xs flex-shrink-0 mt-0.5" style={{ color: "var(--ink-soft)" }}>
          {formatRelative(recipient.bookedAt)}
        </div>
      </div>

      {/* ボタン */}
      <div className="flex gap-2">
        <button
          onClick={onDecline}
          disabled={busy}
          className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: "rgba(26,26,46,0.07)", color: "var(--ink-soft)" }}
        >
          却下
        </button>
        <button
          onClick={onApprove}
          disabled={busy}
          className="flex-[2] py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: "var(--terra)", color: "white" }}
        >
          {busy ? "処理中..." : "承認"}
        </button>
      </div>
    </div>
  );
}

export function PendingClient({ recipients }: { recipients: PendingRecipient[] }) {
  const [optimisticList, removeOptimistic] = useOptimistic(
    recipients,
    (state, removedId: string) => state.filter((r) => r.id !== removedId),
  );
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  function showToast(t: Toast) {
    setToast(t);
    setTimeout(() => setToast(null), 3000);
  }

  function handleApprove(id: string) {
    setBusyId(id);
    startTransition(async () => {
      removeOptimistic(id);
      const result = await approveBookingRequest(id);
      setBusyId(null);
      if (result.ok) {
        showToast({ type: "success", message: "✅ 承認しました。予約が作成されました。" });
      } else {
        showToast({ type: "error", message: `❌ ${result.error}` });
      }
    });
  }

  function handleDecline(id: string) {
    setBusyId(id);
    startTransition(async () => {
      removeOptimistic(id);
      const result = await declineBookingRequest(id);
      setBusyId(null);
      if (result.ok) {
        showToast({ type: "success", message: "却下しました。" });
      } else {
        showToast({ type: "error", message: `❌ ${result.error}` });
      }
    });
  }

  if (optimisticList.length === 0) {
    return (
      <>
        <ToastBanner toast={toast} />
        <div className="card p-8 text-center">
          <div className="text-3xl mb-4">📭</div>
          <div className="font-semibold mb-2">現在、予約希望はありません</div>
          <p className="text-sm mb-5" style={{ color: "var(--ink-soft)" }}>
            オファーを送ると、ここに予約希望が届きます。
          </p>
          <Link
            href="/line/offers"
            className="inline-flex items-center gap-1 text-sm font-semibold"
            style={{ color: "var(--terra)" }}
          >
            離脱気味のお客様にオファーを送る →
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <ToastBanner toast={toast} />
      <div className="flex flex-col gap-3 pb-8">
        {optimisticList.map((r) => (
          <RecipientCard
            key={r.id}
            recipient={r}
            onApprove={() => handleApprove(r.id)}
            onDecline={() => handleDecline(r.id)}
            busy={busyId === r.id && isPending}
          />
        ))}
      </div>
    </>
  );
}
