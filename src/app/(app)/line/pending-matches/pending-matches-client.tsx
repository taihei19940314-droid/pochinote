"use client";

import { useState } from "react";
import Link from "next/link";
import type { CustomerCandidate } from "@/lib/line/find-customer-candidates";

interface Entry {
  id: string;
  lineUserIdMasked: string;
  lineFollowedAt: string | null;
  messages: Array<{ content: string; sent_at: string }>;
  parsedOwnerName: string | null;
  parsedPetName: string | null;
  parsedConfidence: string | null;
  rawText: string | null;
  candidates: CustomerCandidate[];
}

interface Props {
  entries: Entry[];
}

type EntryStatus =
  | { type: "idle" }
  | { type: "linking" }
  | { type: "ignoring" }
  | { type: "create_new" }
  | { type: "done"; message: string; newCustomerId?: string }
  | { type: "error"; message: string };

// ── 新規登録モーダル ──────────────────────────────────────────────
function CreateNewModal({
  entry,
  onSuccess,
  onClose,
}: {
  entry: Entry;
  onSuccess: (customerId: string, name: string) => void;
  onClose: () => void;
}) {
  const [ownerName, setOwnerName] = useState(entry.parsedOwnerName ?? "");
  const [petName, setPetName] = useState(entry.parsedPetName ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSave() {
    if (!ownerName.trim()) { setErr("飼い主名は必須です"); return; }
    setSaving(true);
    setErr(null);
    try {
      const res = await fetch(`/api/line/pending-matches/${entry.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_new", name: ownerName.trim(), petName: petName.trim() || undefined }),
      });
      const data = await res.json() as { success?: boolean; newCustomerId?: string; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? "保存失敗");
      onSuccess(data.newCustomerId ?? entry.id, ownerName.trim());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "エラーが発生しました");
      setSaving(false);
    }
  }

  const inputClass = "w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-1";
  const inputStyle = { borderColor: "rgba(26,26,46,0.15)", background: "white" };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(26,26,46,0.5)" }}>
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "var(--paper)" }}>
        <h2 className="font-semibold text-lg mb-1">新規顧客として登録</h2>
        <p className="text-xs mb-4" style={{ color: "var(--ink-soft)" }}>
          ※ 詳細(電話番号、犬種、年齢など)は保存後に編集画面で追加できます
        </p>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--ink-soft)" }}>
              飼い主名 <span style={{ color: "var(--terra)" }}>*</span>
            </label>
            <input
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="田中 花子"
              className={inputClass}
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--ink-soft)" }}>
              ペット名（任意）
            </label>
            <input
              type="text"
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="こてつ"
              className={inputClass}
              style={inputStyle}
            />
          </div>
        </div>

        {err && (
          <div className="mb-3 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(192,57,43,0.08)", color: "#c0392b" }}>
            {err}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors hover:bg-black/5"
            style={{ borderColor: "rgba(26,26,46,0.2)" }}
          >
            キャンセル
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--terra)", color: "white" }}
          >
            {saving ? "保存中..." : "登録する"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 1エントリ分のカード ───────────────────────────────────────────
function PendingCard({ entry }: { entry: Entry }) {
  const [status, setStatus] = useState<EntryStatus>({ type: "idle" });

  async function handleLink(targetCustomerId: string) {
    setStatus({ type: "linking" });
    try {
      const res = await fetch(`/api/line/pending-matches/${entry.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "link_to_existing", targetCustomerId }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? "紐付け失敗");
      setStatus({ type: "done", message: "✅ 紐付けが完了しました" });
    } catch (e) {
      setStatus({ type: "error", message: e instanceof Error ? e.message : "エラーが発生しました" });
    }
  }

  async function handleIgnore() {
    setStatus({ type: "ignoring" });
    try {
      const res = await fetch(`/api/line/pending-matches/${entry.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ignore" }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? "無視失敗");
      setStatus({ type: "done", message: "非表示にしました" });
    } catch (e) {
      setStatus({ type: "error", message: e instanceof Error ? e.message : "エラーが発生しました" });
    }
  }

  // 完了後は最小表示
  if (status.type === "done") {
    return (
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium" style={{ color: "var(--sage)" }}>{status.message}</p>
          {status.newCustomerId && (
            <Link href={`/customers/${status.newCustomerId}/edit`}
              className="text-xs font-semibold underline" style={{ color: "var(--terra)" }}>
              詳細を編集
            </Link>
          )}
        </div>
      </div>
    );
  }

  const isWorking = status.type === "linking" || status.type === "ignoring";

  return (
    <>
      {status.type === "create_new" && (
        <CreateNewModal
          entry={entry}
          onSuccess={(id, name) => setStatus({ type: "done", message: `✅ ${name}さんを登録しました`, newCustomerId: id })}
          onClose={() => setStatus({ type: "idle" })}
        />
      )}

      <div className="card p-5 space-y-4">
        {/* ヘッダー */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-mono" style={{ color: "var(--ink-soft)" }}>{entry.lineUserIdMasked}</p>
            {entry.lineFollowedAt && (
              <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>
                友だち追加: {entry.lineFollowedAt}
              </p>
            )}
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(217,119,87,0.12)", color: "var(--terra)" }}>
            未特定
          </span>
        </div>

        {/* 受信メッセージ */}
        {entry.messages.length > 0 && (
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: "var(--ink-soft)" }}>受信メッセージ</p>
            <div className="space-y-1.5">
              {entry.messages.map((m, i) => (
                <div key={i} className="px-3 py-2 rounded-lg text-sm"
                  style={{ background: "rgba(26,26,46,0.04)" }}>
                  {m.content}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* パース結果 */}
        {(entry.parsedOwnerName || entry.parsedPetName) && (
          <div className="px-3 py-2.5 rounded-lg"
            style={{ background: "rgba(107,142,127,0.1)" }}>
            <p className="text-xs font-medium mb-1" style={{ color: "var(--sage)" }}>
              自動検出
              {entry.parsedConfidence === "high" && " — 高確信度"}
              {entry.parsedConfidence === "medium" && " — 中確信度"}
            </p>
            <div className="text-sm space-y-0.5">
              {entry.parsedOwnerName && <p>飼い主: <strong>{entry.parsedOwnerName}</strong></p>}
              {entry.parsedPetName && <p>ペット: <strong>{entry.parsedPetName}</strong></p>}
            </div>
          </div>
        )}

        {/* 候補リスト */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: "var(--ink-soft)" }}>
            既存顧客の候補
          </p>
          {entry.candidates.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--ink-soft)" }}>該当顧客なし</p>
          ) : (
            <div className="space-y-2">
              {entry.candidates.map((cand) => (
                <div key={cand.customer.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                  style={{ borderColor: "rgba(26,26,46,0.1)" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{cand.customer.name}</p>
                    <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
                      {cand.pets.map((p) => p.name).join(", ")}
                      {cand.customer.phone ? ` / ${cand.customer.phone}` : ""}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--sage)" }}>
                      {cand.matchedFields.join(" · ")}
                    </p>
                  </div>
                  <button
                    onClick={() => handleLink(cand.customer.id)}
                    disabled={isWorking}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-40"
                    style={{ background: "var(--terra)", color: "white" }}
                  >
                    {status.type === "linking" ? "処理中..." : "紐付け"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* エラー表示 */}
        {status.type === "error" && (
          <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(192,57,43,0.08)", color: "#c0392b" }}>
            {status.message}
          </p>
        )}

        {/* アクションボタン */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => setStatus({ type: "create_new" })}
            disabled={isWorking}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold border transition-colors hover:bg-black/5 disabled:opacity-40"
            style={{ borderColor: "rgba(26,26,46,0.2)" }}
          >
            新規顧客として登録
          </button>
          <button
            onClick={handleIgnore}
            disabled={isWorking}
            className="py-2.5 px-4 rounded-lg text-sm transition-colors hover:bg-black/5 disabled:opacity-40"
            style={{ color: "var(--ink-soft)" }}
          >
            {status.type === "ignoring" ? "処理中..." : "無視"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── メインエクスポート ─────────────────────────────────────────────
export default function PendingMatchesClient({ entries }: Props) {
  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <PendingCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
