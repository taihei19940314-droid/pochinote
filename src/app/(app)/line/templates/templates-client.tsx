"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { expandTemplateVariables } from "@/lib/line/expand-template-variables";

interface Template {
  id: string;
  template_type: string;
  content: string;
  updated_at: string;
}

interface Props {
  templates: Template[];
  salonName: string;
}

const TYPE_LABELS: Record<string, { name: string; description: string }> = {
  friendly: {
    name: "フレンドリー型",
    description: "親しみやすい雰囲気のサロン向け",
  },
  business: {
    name: "業務的型",
    description: "フォーマルな対応を好むサロン向け",
  },
  sales: {
    name: "営業的型",
    description: "プロモーション色強め、当日対応に強い",
  },
};

const CHAR_LIMIT = 1000;

function charCountColor(len: number): string {
  if (len > CHAR_LIMIT) return "#c0392b";
  if (len > 800) return "var(--terra)";
  return "var(--ink-soft)";
}

type CardMode = "display" | "editing" | "preview";

interface CardState {
  mode: CardMode;
  draft: string;
  saving: boolean;
  saveSuccess: boolean;
  saveError: string | null;
}

function TemplateCard({
  template,
  salonName,
}: {
  template: Template;
  salonName: string;
}) {
  const label = TYPE_LABELS[template.template_type] ?? {
    name: template.template_type,
    description: "",
  };

  const [content, setContent] = useState(template.content);
  const [state, setState] = useState<CardState>({
    mode: "display",
    draft: template.content,
    saving: false,
    saveSuccess: false,
    saveError: null,
  });

  const previewSamples = {
    customerName: "田中 花子",
    salonName: salonName || "サロン名",
    date: "5月25日(日)",
    time: "14:00",
    daysSinceLastVisit: 60,
  };

  function startEditing() {
    setState((s) => ({ ...s, mode: "editing", draft: content, saveSuccess: false, saveError: null }));
  }

  function cancelEditing() {
    setState((s) => ({ ...s, mode: "display", draft: content, saveError: null }));
  }

  function showPreview() {
    setState((s) => ({ ...s, mode: "preview", saveSuccess: false, saveError: null }));
  }

  function backToDisplay() {
    setState((s) => ({ ...s, mode: "display" }));
  }

  function previewThenEdit() {
    setState((s) => ({ ...s, mode: "editing", draft: content, saveSuccess: false, saveError: null }));
  }

  async function save() {
    if (state.draft.trim() === "") return;
    if (state.draft.length > CHAR_LIMIT) return;

    setState((s) => ({ ...s, saving: true, saveError: null }));
    try {
      const res = await fetch(`/api/line/templates/${template.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: state.draft }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "保存に失敗しました");
      }
      setContent(state.draft);
      setState((s) => ({
        ...s,
        saving: false,
        mode: "display",
        saveSuccess: true,
        saveError: null,
      }));
      setTimeout(() => setState((s) => ({ ...s, saveSuccess: false })), 3000);
    } catch (e) {
      setState((s) => ({
        ...s,
        saving: false,
        saveError: e instanceof Error ? e.message : "保存に失敗しました",
      }));
    }
  }

  const charLen = state.draft.length;

  return (
    <div className="card p-5 mb-4">
      {/* カードヘッダー */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold">{label.name}</span>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(217,119,87,0.12)", color: "var(--terra)" }}
          >
            {template.template_type}
          </span>
        </div>
        <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
          {label.description}
        </p>
      </div>

      {/* 本文エリア */}
      {state.mode === "editing" ? (
        <div className="mb-3">
          <Textarea
            value={state.draft}
            onChange={(e) => setState((s) => ({ ...s, draft: e.target.value }))}
            rows={8}
            className="text-sm font-mono leading-relaxed resize-y"
            style={{ minHeight: 160 }}
          />
          <div className="flex justify-end mt-1">
            <span
              className="text-xs"
              style={{ color: charCountColor(charLen) }}
            >
              {charLen} / {CHAR_LIMIT} 文字
            </span>
          </div>
          {state.saveError && (
            <p className="text-xs mt-2" style={{ color: "#c0392b" }}>
              {state.saveError}
            </p>
          )}
        </div>
      ) : state.mode === "preview" ? (
        <div
          className="rounded-lg px-4 py-3 mb-3 text-sm leading-relaxed whitespace-pre-wrap"
          style={{ background: "rgba(107,142,127,0.08)", color: "var(--ink)" }}
        >
          {expandTemplateVariables(content, previewSamples)}
        </div>
      ) : (
        /* display */
        <div
          className="rounded-lg px-4 py-3 mb-3 text-sm leading-relaxed whitespace-pre-wrap font-mono"
          style={{ background: "rgba(26,26,46,0.04)", color: "var(--ink)" }}
        >
          {content}
        </div>
      )}

      {/* 保存成功バナー */}
      {state.saveSuccess && (
        <div
          className="px-3 py-2 rounded-lg text-xs font-medium mb-3"
          style={{ background: "rgba(107,142,127,0.15)", color: "var(--sage)" }}
        >
          ✓ 保存しました
        </div>
      )}

      {/* アクションボタン */}
      {state.mode === "display" && (
        <div className="flex gap-2">
          <Button
            onClick={startEditing}
            variant="outline"
            size="sm"
            className="text-xs h-8"
          >
            編集
          </Button>
          <Button
            onClick={showPreview}
            variant="outline"
            size="sm"
            className="text-xs h-8"
          >
            プレビュー
          </Button>
        </div>
      )}

      {state.mode === "editing" && (
        <div className="flex gap-2">
          <Button
            onClick={save}
            disabled={
              state.saving ||
              state.draft.trim() === "" ||
              state.draft.length > CHAR_LIMIT
            }
            size="sm"
            className="text-xs h-8 font-semibold"
            style={{ background: "var(--terra)", color: "white" }}
          >
            {state.saving ? "保存中..." : "保存"}
          </Button>
          <Button
            onClick={cancelEditing}
            disabled={state.saving}
            variant="outline"
            size="sm"
            className="text-xs h-8"
          >
            キャンセル
          </Button>
        </div>
      )}

      {state.mode === "preview" && (
        <div className="flex gap-2">
          <Button
            onClick={backToDisplay}
            variant="outline"
            size="sm"
            className="text-xs h-8"
          >
            編集に戻る
          </Button>
          <Button
            onClick={previewThenEdit}
            variant="outline"
            size="sm"
            className="text-xs h-8"
          >
            編集モードへ
          </Button>
        </div>
      )}
    </div>
  );
}

export function TemplatesClient({ templates, salonName }: Props) {
  return (
    <>
      <div>
        {templates.map((t) => (
          <TemplateCard key={t.id} template={t} salonName={salonName} />
        ))}
      </div>

      {/* 変数の説明セクション */}
      <div
        className="rounded-xl p-5 mt-2"
        style={{ background: "rgba(26,26,46,0.04)" }}
      >
        <h2 className="font-semibold text-sm mb-3">使える変数</h2>
        <ul className="space-y-2">
          {[
            ["{顧客名}", "お客様の名前"],
            ["{サロン名}", "サロン名"],
            ["{日付}", "空き枠の日付"],
            ["{時刻}", "空き枠の時刻"],
            ["{日数}", "最終来店からの経過日数"],
          ].map(([variable, desc]) => (
            <li key={variable} className="flex items-baseline gap-2 text-sm">
              <span
                className="font-mono text-xs px-1.5 py-0.5 rounded flex-shrink-0"
                style={{ background: "rgba(26,26,46,0.08)", color: "var(--ink)" }}
              >
                {variable}
              </span>
              <span style={{ color: "var(--ink-soft)" }}>{desc}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
