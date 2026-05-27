"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { expandTemplateVariables } from "@/lib/line/expand-template-variables";
import { calculateSlotCount } from "@/lib/availability-client";
import { getJstDateStr } from "@/lib/availability";
import type { InactiveCustomer } from "@/lib/inactive-customers";

// ─── 型定義 ──────────────────────────────────────────────────
export type SlotInfo = {
  dateLabel: string;
  startHHMM: string;
  endHHMM: string;
  slotCount: number;
};

export type BusinessSettings = {
  hoursStart: string;
  hoursEnd: string;
  slotMinutes: number;
  minLeadTimeMinutes: number;
};

export type EmptySummary = {
  totalLinkedCustomers: number;
  customersWithoutVisitHistory: number;
  inactiveThresholdDays: number;
};

export type TemplateOption = {
  type: string;
  label: string;
  content: string;
};

type SendResultItem = { name: string; reason?: string; lastSentAt?: string | null };
type SendResult = {
  success: number;
  failed: SendResultItem[];
  skipped: SendResultItem[];
  blocked: SendResultItem[];
  tokenError: boolean;
};

type Phase =
  | { tag: "idle" }
  | { tag: "confirming"; templateType: string }
  | { tag: "sending" }
  | { tag: "done"; result: SendResult }
  | { tag: "token_error" };

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

// ─── 日付フォーマット ─────────────────────────────────────────
function formatLastVisit(date: Date): string {
  const jst = new Date(date.getTime() + 9 * 3600_000);
  const M = jst.getUTCMonth() + 1;
  const D = jst.getUTCDate();
  const w = WEEKDAY_LABELS[jst.getUTCDay()];
  return `${M}/${D}(${w})`;
}

function formatSentAt(iso: string | null | undefined): string {
  if (!iso) return "不明";
  const jst = new Date(new Date(iso).getTime() + 9 * 3600_000);
  const M = jst.getUTCMonth() + 1;
  const D = jst.getUTCDate();
  const elapsed = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return `${M}/${D} (${elapsed}日前)`;
}

// ─── 時刻を "HH:MM" → その日の JST ISO 文字列(UTC)に変換 ───
function hhmToIso(hhMM: string, dateIso: string): string {
  const [h, m] = hhMM.split(":").map(Number);
  const base = new Date(dateIso);
  // slotRawStart は JST 午前0時を UTC 変換した ISO → 日付部分を使う
  const jstBase = new Date(base.getTime() + 9 * 3600_000);
  const jstDate = jstBase.toISOString().slice(0, 10); // "YYYY-MM-DD"
  // JST HH:MM → UTC
  const jstMs = new Date(`${jstDate}T${hhMM}:00+09:00`).getTime();
  return new Date(jstMs).toISOString();
}

// ─── バリデーション ────────────────────────────────────────────
type ValidationError =
  | { type: "order"; message: string }
  | { type: "hours"; message: string }
  | { type: "lead"; message: string };

function validate(
  start: string,
  end: string,
  bs: BusinessSettings,
  nowIso: string,
  slotDateIso: string,
): ValidationError | null {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;

  if (startMin >= endMin) {
    return { type: "order", message: "終了時刻は開始時刻より後にしてください" };
  }

  const [bsh, bsm] = bs.hoursStart.split(":").map(Number);
  const [beh, bem] = bs.hoursEnd.split(":").map(Number);
  if (startMin < bsh * 60 + bsm || endMin > beh * 60 + bem) {
    return {
      type: "hours",
      message: `営業時間外です（営業: ${bs.hoursStart}〜${bs.hoursEnd}）`,
    };
  }

  // リードタイム: 絶対時刻(ms)で比較することで日付をまたぐ枠を正しく判定する
  const slotJstDate = getJstDateStr(new Date(slotDateIso));
  const slotStartMs = new Date(`${slotJstDate}T${start}:00+09:00`).getTime();
  const thresholdMs = new Date(nowIso).getTime() + bs.minLeadTimeMinutes * 60_000;
  if (slotStartMs < thresholdMs) {
    return {
      type: "lead",
      message: `リードタイム（${bs.minLeadTimeMinutes}分）後以降を指定してください`,
    };
  }

  return null;
}

// ─── 空き枠編集カード ──────────────────────────────────────────
function SlotEditor({
  dateLabel,
  start,
  end,
  onStartChange,
  onEndChange,
  bs,
  nowIso,
  slotDateIso,
}: {
  dateLabel: string;
  start: string;
  end: string;
  onStartChange: (v: string) => void;
  onEndChange: (v: string) => void;
  bs: BusinessSettings;
  nowIso: string;
  slotDateIso: string;
}) {
  const slotCount = calculateSlotCount(start, end, bs.slotMinutes);
  const error = validate(start, end, bs, nowIso, slotDateIso);

  return (
    <div className="card p-4 mb-6" style={{ borderLeft: "3px solid var(--terra)" }}>
      <div
        className="text-[10px] tracking-[0.18em] uppercase mb-2 font-semibold"
        style={{ color: "var(--terra)" }}
      >
        対象の空き枠
      </div>
      <div className="text-sm font-semibold mb-2" style={{ color: "var(--ink-soft)" }}>
        {dateLabel}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <input
          type="time"
          step={900}
          value={start}
          onChange={(e) => onStartChange(e.target.value)}
          className="h-10 rounded-lg border px-2 text-sm font-semibold w-[120px]"
          style={{
            borderColor: error ? "#c0392b" : "rgba(26,26,46,0.18)",
            background: "var(--paper)",
            color: "var(--ink)",
          }}
        />
        <span className="text-sm" style={{ color: "var(--ink-soft)" }}>〜</span>
        <input
          type="time"
          step={900}
          value={end}
          onChange={(e) => onEndChange(e.target.value)}
          className="h-10 rounded-lg border px-2 text-sm font-semibold w-[120px]"
          style={{
            borderColor: error ? "#c0392b" : "rgba(26,26,46,0.18)",
            background: "var(--paper)",
            color: "var(--ink)",
          }}
        />
      </div>
      {error ? (
        <div className="text-xs mt-1" style={{ color: "#c0392b" }}>
          ⚠️ {error.message}
        </div>
      ) : (
        <div className="text-sm mt-0.5" style={{ color: "var(--ink-soft)" }}>
          {slotCount}枠分（1枠 {bs.slotMinutes}分）
        </div>
      )}
    </div>
  );
}

// ─── 0件サマリー ──────────────────────────────────────────────
function EmptySummarySection({ summary }: { summary: EmptySummary }) {
  return (
    <div className="card p-8 text-center">
      <div className="text-3xl mb-4">🎉</div>
      <div className="font-semibold mb-2">離脱気味のお客様はいません</div>
      <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--ink-soft)" }}>
        全員が{summary.inactiveThresholdDays}日以内にご来店されています。
      </p>
      <div className="rounded-xl p-4 text-left space-y-2" style={{ background: "rgba(26,26,46,0.04)" }}>
        <div className="text-xs font-semibold mb-1" style={{ color: "var(--ink-soft)" }}>
          サロンの状況
        </div>
        {[
          ["LINE 連携済み顧客", `${summary.totalLinkedCustomers}人`],
          ["離脱判定", `最終来店から ${summary.inactiveThresholdDays}日以上経過`],
          ["来店記録のない顧客", `${summary.customersWithoutVisitHistory}人（対象外）`],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span style={{ color: "var(--ink-soft)" }}>{label}</span>
            <span className="font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 確認モーダル ─────────────────────────────────────────────
function ConfirmModal({
  phase,
  candidates,
  checkedIds,
  templates,
  slotInfo,
  salonName,
  onClose,
  onSend,
}: {
  phase: Phase & { tag: "confirming" };
  candidates: InactiveCustomer[];
  checkedIds: Set<string>;
  templates: TemplateOption[];
  slotInfo?: SlotInfo;
  salonName: string;
  onClose: () => void;
  onSend: (templateType: string) => void;
}) {
  const [selectedType, setSelectedType] = useState(phase.templateType);

  const selectedTemplate = templates.find((t) => t.type === selectedType);
  const selectedCandidates = candidates.filter((c) => checkedIds.has(c.customerId));
  const sample = selectedCandidates[0];

  const previewText = selectedTemplate && sample
    ? expandTemplateVariables(selectedTemplate.content, {
        customerName: sample.customerName,
        salonName,
        date: slotInfo?.dateLabel ?? "近日中",
        time: slotInfo?.startHHMM ?? "—",
        daysSinceLastVisit: sample.daysSinceLastVisit,
      })
    : selectedTemplate?.content ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pb-14 sm:pb-4">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* sheet */}
      <div
        className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--paper)", maxHeight: "90dvh", overflowY: "auto" }}
      >
        <div className="p-5 sm:p-6">
          {/* ヘッダー */}
          <div className="mb-5">
            <div className="font-display text-lg font-semibold mb-1">
              {selectedCandidates.length}人にオファーを送信します
            </div>
            {slotInfo && (
              <div className="text-sm" style={{ color: "var(--ink-soft)" }}>
                {slotInfo.dateLabel} {slotInfo.startHHMM}〜{slotInfo.endHHMM}
              </div>
            )}
          </div>

          {/* テンプレート選択 */}
          {templates.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-semibold mb-2" style={{ color: "var(--ink-soft)" }}>
                メッセージテンプレート
              </div>
              <div className="flex gap-2 flex-wrap">
                {templates.map((t) => (
                  <button
                    key={t.type}
                    onClick={() => setSelectedType(t.type)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                    style={
                      selectedType === t.type
                        ? { background: "var(--terra)", color: "white" }
                        : { background: "rgba(26,26,46,0.07)", color: "var(--ink-soft)" }
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* プレビュー */}
          {sample && (
            <div className="mb-5">
              <div className="text-xs font-semibold mb-2" style={{ color: "var(--ink-soft)" }}>
                送信プレビュー（{sample.customerName}さん）
              </div>
              <div
                className="rounded-xl p-4 text-sm leading-relaxed whitespace-pre-line"
                style={{
                  background: "rgba(26,26,46,0.04)",
                  color: "var(--ink)",
                  fontFamily: "inherit",
                  minHeight: 80,
                }}
              >
                {previewText || "—"}
              </div>
            </div>
          )}

          {/* フッターボタン */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(26,26,46,0.07)", color: "var(--ink-soft)" }}
            >
              キャンセル
            </button>
            <button
              onClick={() => onSend(selectedType)}
              disabled={selectedCandidates.length === 0}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "var(--terra)", color: "white" }}
            >
              本当に送る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 結果画面モーダル ─────────────────────────────────────────
function ResultModal({
  result,
  onClose,
}: {
  result: SendResult;
  onClose: () => void;
}) {
  if (result.tokenError) {
    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pb-14 sm:pb-4">
        <div className="absolute inset-0 bg-black/40" />
        <div
          className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl p-6"
          style={{ background: "var(--paper)" }}
        >
          <div className="text-2xl mb-3">❌</div>
          <div className="font-semibold text-base mb-2">LINE トークンが無効です</div>
          <p className="text-sm mb-5" style={{ color: "var(--ink-soft)" }}>
            設定画面でアクセストークンを再登録してください。
          </p>
          <div className="flex gap-3">
            <a
              href="/line/settings"
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-center"
              style={{ background: "var(--terra)", color: "white" }}
            >
              設定画面へ
            </a>
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: "rgba(26,26,46,0.07)", color: "var(--ink-soft)" }}
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pb-14 sm:pb-4">
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl p-6"
        style={{ background: "var(--paper)", maxHeight: "90dvh", overflowY: "auto" }}
      >
        <div className="text-2xl mb-3">✅</div>
        <div className="font-semibold text-base mb-4">送信完了</div>

        <div className="space-y-3 mb-5">
          <ResultRow label="成功" value={`${result.success ?? 0}人`} color="var(--sage)" />

          {(result.failed ?? []).length > 0 && (
            <div>
              <ResultRow label="失敗" value={`${result.failed.length}人`} color="#c0392b" />
              <ul className="mt-1 space-y-0.5 pl-3">
                {(result.failed ?? []).map((f, i) => (
                  <li key={i} className="text-xs" style={{ color: "var(--ink-soft)" }}>
                    {f.name}：{f.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(result.skipped ?? []).length > 0 && (
            <div>
              <ResultRow label="スキップ" value={`${result.skipped.length}人（再送禁止期間内）`} color="var(--ink-soft)" />
              <ul className="mt-1 space-y-0.5 pl-3">
                {(result.skipped ?? []).map((s, i) => (
                  <li key={i} className="text-xs" style={{ color: "var(--ink-soft)" }}>
                    {s.name}（{formatSentAt(s.lastSentAt)}に送信済み）
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(result.blocked ?? []).length > 0 && (
            <div>
              <ResultRow label="ブロック" value={`${result.blocked.length}人`} color="#c0392b" />
              <ul className="mt-1 space-y-0.5 pl-3">
                {(result.blocked ?? []).map((b, i) => (
                  <li key={i} className="text-xs" style={{ color: "var(--ink-soft)" }}>
                    {b.name}（LINE をブロック中 → 今後対象外に設定しました）
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-semibold"
          style={{ background: "var(--terra)", color: "white" }}
        >
          OK
        </button>
      </div>
    </div>
  );
}

function ResultRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span style={{ color: "var(--ink-soft)" }}>{label}</span>
      <span className="font-semibold" style={{ color }}>{value}</span>
    </div>
  );
}

// ─── メインクライアント島 ─────────────────────────────────────
export function PreviewClient({
  candidates,
  slotInfo,
  slotRawStart,
  slotRawEnd,
  emptySummary,
  templates,
  salonName,
  businessSettings,
  nowIso,
}: {
  candidates: InactiveCustomer[];
  slotInfo?: SlotInfo;
  slotRawStart?: string;
  slotRawEnd?: string;
  emptySummary: EmptySummary;
  templates: TemplateOption[];
  salonName: string;
  businessSettings: BusinessSettings;
  nowIso: string;
}) {
  const router = useRouter();
  const [checked, setChecked] = useState<Set<string>>(
    () => new Set(candidates.map((c) => c.customerId)),
  );
  const [phase, setPhase] = useState<Phase>({ tag: "idle" });

  // 時刻編集 state(初期値は Server が渡した時刻 or 空)
  const [editStart, setEditStart] = useState(slotInfo?.startHHMM ?? "");
  const [editEnd, setEditEnd] = useState(slotInfo?.endHHMM ?? "");

  const slotError = slotInfo && slotRawStart
    ? validate(editStart, editEnd, businessSettings, nowIso, slotRawStart)
    : null;
  const editedSlotCount = slotInfo
    ? calculateSlotCount(editStart, editEnd, businessSettings.slotMinutes)
    : 0;

  // 確認モーダルに渡す最新 slotInfo(編集後の値を反映)
  const currentSlotInfo = useMemo<SlotInfo | undefined>(() => {
    if (!slotInfo) return undefined;
    return {
      dateLabel: slotInfo.dateLabel,
      startHHMM: editStart,
      endHHMM: editEnd,
      slotCount: editedSlotCount,
    };
  }, [slotInfo, editStart, editEnd, editedSlotCount]);

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function openModal() {
    const defaultType = templates[0]?.type ?? "friendly";
    setPhase({ tag: "confirming", templateType: defaultType });
  }

  async function handleSend(templateType: string) {
    setPhase({ tag: "sending" });
    try {
      // 編集後の時刻を ISO 文字列に変換して送信
      const effectiveStart = slotRawStart && editStart
        ? hhmToIso(editStart, slotRawStart)
        : slotRawStart;
      const effectiveEnd = slotRawStart && editEnd
        ? hhmToIso(editEnd, slotRawStart)
        : slotRawEnd;

      const res = await fetch("/api/offers/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedCustomerIds: [...checked],
          templateType,
          slotStart: effectiveStart,
          slotEnd: effectiveEnd,
        }),
      });

      // JSON パース失敗を考慮してテキストで受け取り、手動でパース
      const text = await res.text();
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(text) as Record<string, unknown>;
      } catch {
        // 非JSON レスポンス(HTML エラーページ等) → 汎用エラー
        setPhase({ tag: "done", result: { success: 0, failed: [], skipped: [], blocked: [], tokenError: false } });
        return;
      }

      if (data.tokenError) {
        setPhase({ tag: "token_error" });
      } else if (!res.ok || data.error) {
        // API エラーレスポンス({ error: "..." }) → 汎用エラー結果
        setPhase({ tag: "done", result: { success: 0, failed: [], skipped: [], blocked: [], tokenError: false } });
      } else {
        // 正常な SendResult として扱う(防御的にデフォルト値を補完)
        setPhase({
          tag: "done",
          result: {
            success: (data.success as number) ?? 0,
            failed: (data.failed as SendResultItem[]) ?? [],
            skipped: (data.skipped as SendResultItem[]) ?? [],
            blocked: (data.blocked as SendResultItem[]) ?? [],
            tokenError: false,
          },
        });
      }
    } catch {
      setPhase({ tag: "done", result: { success: 0, failed: [], skipped: [], blocked: [], tokenError: false } });
    }
  }

  function handleResultClose() {
    setPhase({ tag: "idle" });
    // 候補リストを最新状態に更新
    router.refresh();
  }

  const checkedCount = checked.size;

  return (
    <>
      {slotInfo && slotRawStart && (
        <SlotEditor
          dateLabel={slotInfo.dateLabel}
          start={editStart}
          end={editEnd}
          onStartChange={setEditStart}
          onEndChange={setEditEnd}
          bs={businessSettings}
          nowIso={nowIso}
          slotDateIso={slotRawStart}
        />
      )}

      {candidates.length === 0 ? (
        <EmptySummarySection summary={emptySummary} />
      ) : (
        <div className="flex flex-col gap-3 pb-28 lg:pb-14">
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
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold tabular-nums" style={{ color: "var(--sage)" }}>
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

      {/* sticky フッター */}
      {candidates.length > 0 && (
        <div
          className="fixed bottom-14 left-0 right-0 z-40 lg:bottom-0 lg:left-64"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
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
            <button
              onClick={openModal}
              disabled={
                checkedCount === 0 ||
                phase.tag === "sending" ||
                !!slotError ||
                (slotInfo != null && editedSlotCount === 0)
              }
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ background: "var(--terra)", color: "white" }}
            >
              {phase.tag === "sending" ? "送信中..." : "送信"}
            </button>
          </div>
        </div>
      )}

      {/* 確認モーダル */}
      {phase.tag === "confirming" && (
        <ConfirmModal
          phase={phase}
          candidates={candidates}
          checkedIds={checked}
          templates={templates}
          slotInfo={currentSlotInfo}
          salonName={salonName}
          onClose={() => setPhase({ tag: "idle" })}
          onSend={handleSend}
        />
      )}

      {/* 結果モーダル */}
      {(phase.tag === "done" || phase.tag === "token_error") && (
        <ResultModal
          result={
            phase.tag === "done"
              ? phase.result
              : { success: 0, failed: [], skipped: [], blocked: [], tokenError: true }
          }
          onClose={handleResultClose}
        />
      )}
    </>
  );
}
