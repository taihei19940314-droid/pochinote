"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

const WEBHOOK_URL = "https://triel-app.vercel.app/api/line/webhook";

interface SettingsData {
  credentials: {
    line_channel_id: string;
    line_channel_secret: string;
    line_access_token: string;
    line_add_friend_url: string;
  };
  autoOffer: {
    inactive_threshold_days: number;
    min_resend_interval_days: number;
    auto_offer_enabled: boolean;
  };
  businessSettings: {
    business_hours_start: string;
    business_hours_end: string;
    closed_weekdays: number[];
    default_slot_minutes: number;
    min_lead_time_minutes: number;
  };
}

const WEEKDAYS = [
  { label: "日", value: 0 },
  { label: "月", value: 1 },
  { label: "火", value: 2 },
  { label: "水", value: 3 },
  { label: "木", value: 4 },
  { label: "金", value: 5 },
  { label: "土", value: 6 },
];

function SaveBanner({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  if (status === "idle") return null;
  const styles: Record<string, { bg: string; color: string; text: string }> = {
    saving: { bg: "rgba(26,26,46,0.06)", color: "var(--ink-soft)", text: "保存中..." },
    saved:  { bg: "rgba(107,142,127,0.15)", color: "var(--sage)",     text: "✓ 保存しました" },
    error:  { bg: "rgba(192,57,43,0.1)",   color: "#c0392b",          text: "保存に失敗しました" },
  };
  const s = styles[status];
  return (
    <div className="mt-3 px-4 py-2.5 rounded-lg text-sm font-medium" style={{ background: s.bg, color: s.color }}>
      {s.text}
    </div>
  );
}

export default function LineSettingsPage() {
  const [credentials, setCredentials] = useState({
    line_channel_id: "",
    line_channel_secret: "",
    line_access_token: "",
    line_add_friend_url: "",
  });
  const [autoOffer, setAutoOffer] = useState({
    inactive_threshold_days: 60,
    min_resend_interval_days: 7,
    auto_offer_enabled: false,
  });
  const [businessSettings, setBusinessSettings] = useState({
    business_hours_start: "09:00",
    business_hours_end: "18:00",
    closed_weekdays: [] as number[],
    default_slot_minutes: 90,
    min_lead_time_minutes: 120,
  });
  const [credStatus, setCredStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [autoStatus, setAutoStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [bizStatus, setBizStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [bizError, setBizError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/line/settings");
      if (!res.ok) return;
      const data: SettingsData = await res.json();
      setCredentials({
        line_channel_id: data.credentials.line_channel_id,
        line_channel_secret: data.credentials.line_channel_secret,
        line_access_token: data.credentials.line_access_token,
        line_add_friend_url: data.credentials.line_add_friend_url,
      });
      setAutoOffer({
        inactive_threshold_days: data.autoOffer.inactive_threshold_days,
        min_resend_interval_days: data.autoOffer.min_resend_interval_days,
        auto_offer_enabled: data.autoOffer.auto_offer_enabled,
      });
      setBusinessSettings({
        business_hours_start: data.businessSettings.business_hours_start,
        business_hours_end: data.businessSettings.business_hours_end,
        closed_weekdays: data.businessSettings.closed_weekdays,
        default_slot_minutes: data.businessSettings.default_slot_minutes,
        min_lead_time_minutes: data.businessSettings.min_lead_time_minutes,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function saveCredentials() {
    setCredStatus("saving");
    try {
      const res = await fetch("/api/line/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      if (!res.ok) throw new Error();
      const data: SettingsData = await res.json();
      setCredentials({
        line_channel_id: data.credentials.line_channel_id,
        line_channel_secret: data.credentials.line_channel_secret,
        line_access_token: data.credentials.line_access_token,
        line_add_friend_url: data.credentials.line_add_friend_url,
      });
      setCredStatus("saved");
    } catch {
      setCredStatus("error");
    } finally {
      setTimeout(() => setCredStatus("idle"), 3000);
    }
  }

  async function saveAutoOffer() {
    setAutoStatus("saving");
    try {
      const res = await fetch("/api/line/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(autoOffer),
      });
      if (!res.ok) throw new Error();
      setAutoStatus("saved");
    } catch {
      setAutoStatus("error");
    } finally {
      setTimeout(() => setAutoStatus("idle"), 3000);
    }
  }

  async function saveBusinessSettings() {
    setBizStatus("saving");
    setBizError(null);
    try {
      const res = await fetch("/api/salons/business-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(businessSettings),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "保存に失敗しました");
      }
      setBizStatus("saved");
    } catch (e) {
      setBizStatus("error");
      setBizError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setTimeout(() => setBizStatus("idle"), 3000);
    }
  }

  function toggleWeekday(value: number) {
    setBusinessSettings((prev) => {
      const exists = prev.closed_weekdays.includes(value);
      return {
        ...prev,
        closed_weekdays: exists
          ? prev.closed_weekdays.filter((d) => d !== value)
          : [...prev.closed_weekdays, value].sort((a, b) => a - b),
      };
    });
  }

  async function copyWebhookUrl() {
    await navigator.clipboard.writeText(WEBHOOK_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
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
        <div className="h-8 w-48 rounded-lg mb-6 animate-pulse" style={{ background: "rgba(26,26,46,0.08)" }} />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5">
              <div className="h-4 w-32 rounded mb-4 animate-pulse" style={{ background: "rgba(26,26,46,0.08)" }} />
              <div className="h-8 w-full rounded-lg animate-pulse" style={{ background: "rgba(26,26,46,0.06)" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto pb-8">
      <Link
        href="/line"
        className="inline-flex items-center gap-1 text-sm mb-6 transition-opacity hover:opacity-70"
        style={{ color: "var(--ink-soft)" }}
      >
        <ChevronLeft size={16} />
        LINE メニューに戻る
      </Link>

      <h1 className="font-display text-2xl font-semibold tracking-tight mb-6">LINE 連携設定</h1>

      {/* セクション1: LINE Messaging API 接続情報 */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-4">LINE Messaging API 接続情報</h2>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="channel_id">チャネル ID</Label>
            <Input
              id="channel_id"
              type="text"
              placeholder="例: 1234567890"
              value={credentials.line_channel_id}
              onChange={(e) => setCredentials((p) => ({ ...p, line_channel_id: e.target.value }))}
              className="h-11 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="channel_secret">チャネルシークレット</Label>
            <Input
              id="channel_secret"
              type="password"
              placeholder="既存値は伏字で表示されます"
              value={credentials.line_channel_secret}
              onChange={(e) => setCredentials((p) => ({ ...p, line_channel_secret: e.target.value }))}
              className="h-11 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="access_token">チャネルアクセストークン</Label>
            <Input
              id="access_token"
              type="password"
              placeholder="既存値は伏字で表示されます"
              value={credentials.line_access_token}
              onChange={(e) => setCredentials((p) => ({ ...p, line_access_token: e.target.value }))}
              className="h-11 text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="add_friend_url">友だち追加 URL</Label>
            <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
              LINE Official Account Manager の「友だち追加」QR コードのリンク URL を貼り付けてください
            </p>
            <Input
              id="add_friend_url"
              type="url"
              placeholder="https://line.me/R/ti/p/@xxxxxxx"
              value={credentials.line_add_friend_url}
              onChange={(e) => setCredentials((p) => ({ ...p, line_add_friend_url: e.target.value }))}
              className="h-11 text-sm"
            />
          </div>
        </div>

        <div className="mt-5">
          <Button
            onClick={saveCredentials}
            disabled={credStatus === "saving"}
            className="w-full h-11 font-semibold"
            style={{ background: "var(--terra)", color: "white" }}
          >
            {credStatus === "saving" ? "保存中..." : "保存"}
          </Button>
          <SaveBanner status={credStatus} />
        </div>
      </div>

      {/* セクション2: 自動オファーの動作設定 */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-4">自動オファーの動作設定</h2>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="threshold_days">離脱判定日数</Label>
            <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
              最終来店からこの日数を超えた顧客をオファー対象とみなします
            </p>
            <div className="flex items-center gap-2">
              <Input
                id="threshold_days"
                type="number"
                min={1}
                value={autoOffer.inactive_threshold_days}
                onChange={(e) =>
                  setAutoOffer((p) => ({ ...p, inactive_threshold_days: Number(e.target.value) }))
                }
                className="h-11 w-28 text-sm"
              />
              <span className="text-sm" style={{ color: "var(--ink-soft)" }}>日</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="resend_days">再送禁止期間</Label>
            <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
              同じ顧客への再送を禁止する最低間隔です
            </p>
            <div className="flex items-center gap-2">
              <Input
                id="resend_days"
                type="number"
                min={0}
                value={autoOffer.min_resend_interval_days}
                onChange={(e) =>
                  setAutoOffer((p) => ({ ...p, min_resend_interval_days: Number(e.target.value) }))
                }
                className="h-11 w-28 text-sm"
              />
              <span className="text-sm" style={{ color: "var(--ink-soft)" }}>日</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <Label htmlFor="auto_offer_switch">自動オファー</Label>
              <p className="text-xs mt-0.5" style={{ color: "var(--ink-soft)" }}>
                空き枠が出た際に自動でオファーを送信します
              </p>
            </div>
            <Switch
              id="auto_offer_switch"
              checked={autoOffer.auto_offer_enabled}
              onCheckedChange={(checked) =>
                setAutoOffer((p) => ({ ...p, auto_offer_enabled: checked }))
              }
            />
          </div>
        </div>

        <div className="mt-5">
          <Button
            onClick={saveAutoOffer}
            disabled={autoStatus === "saving"}
            className="w-full h-11 font-semibold"
            style={{ background: "var(--terra)", color: "white" }}
          >
            {autoStatus === "saving" ? "保存中..." : "保存"}
          </Button>
          <SaveBanner status={autoStatus} />
        </div>
      </div>

      {/* セクション3: 営業設定 */}
      <div className="card p-5 mb-4">
        <h2 className="font-semibold mb-1">営業設定</h2>
        <p className="text-xs mb-4" style={{ color: "var(--ink-soft)" }}>
          空き枠の自動検出に使われる設定です。
        </p>

        <div className="space-y-5">
          {/* 営業時間 */}
          <div className="space-y-1.5">
            <Label>営業時間</Label>
            <div className="flex items-center gap-3">
              <Input
                type="time"
                value={businessSettings.business_hours_start}
                onChange={(e) =>
                  setBusinessSettings((p) => ({ ...p, business_hours_start: e.target.value }))
                }
                className="h-11 w-36 text-sm"
              />
              <span className="text-sm" style={{ color: "var(--ink-soft)" }}>〜</span>
              <Input
                type="time"
                value={businessSettings.business_hours_end}
                onChange={(e) =>
                  setBusinessSettings((p) => ({ ...p, business_hours_end: e.target.value }))
                }
                className="h-11 w-36 text-sm"
              />
            </div>
          </div>

          {/* 定休日 */}
          <div className="space-y-2">
            <Label>定休日</Label>
            <div className="flex gap-2 flex-wrap">
              {WEEKDAYS.map(({ label, value }) => {
                const checked = businessSettings.closed_weekdays.includes(value);
                return (
                  <label
                    key={value}
                    className="flex items-center gap-1.5 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleWeekday(value)}
                      className="w-4 h-4 rounded accent-[color:var(--terra)]"
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 1枠の長さ */}
          <div className="space-y-1.5">
            <Label htmlFor="slot_minutes">1枠の長さ</Label>
            <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
              小型犬で90分、大型犬で120分が目安です
            </p>
            <div className="flex items-center gap-2">
              <Input
                id="slot_minutes"
                type="number"
                min={30}
                max={240}
                step={15}
                value={businessSettings.default_slot_minutes}
                onChange={(e) =>
                  setBusinessSettings((p) => ({
                    ...p,
                    default_slot_minutes: Number(e.target.value),
                  }))
                }
                className="h-11 w-28 text-sm"
              />
              <span className="text-sm" style={{ color: "var(--ink-soft)" }}>分</span>
            </div>
          </div>

          {/* 最短リードタイム */}
          <div className="space-y-1.5">
            <Label htmlFor="lead_time_minutes">最短リードタイム</Label>
            <p className="text-xs" style={{ color: "var(--ink-soft)" }}>
              現在から何分先以降の空き枠を検出するか
            </p>
            <div className="flex items-center gap-2">
              <Input
                id="lead_time_minutes"
                type="number"
                min={0}
                max={1440}
                step={15}
                value={businessSettings.min_lead_time_minutes}
                onChange={(e) =>
                  setBusinessSettings((p) => ({
                    ...p,
                    min_lead_time_minutes: Number(e.target.value),
                  }))
                }
                className="h-11 w-28 text-sm"
              />
              <span className="text-sm" style={{ color: "var(--ink-soft)" }}>分</span>
            </div>
          </div>
        </div>

        {bizError && bizStatus === "error" && (
          <div className="mt-3 px-4 py-2.5 rounded-lg text-sm" style={{ background: "rgba(192,57,43,0.1)", color: "#c0392b" }}>
            {bizError}
          </div>
        )}

        <div className="mt-5">
          <Button
            onClick={saveBusinessSettings}
            disabled={bizStatus === "saving"}
            className="w-full h-11 font-semibold"
            style={{ background: "var(--terra)", color: "white" }}
          >
            {bizStatus === "saving" ? "保存中..." : "営業設定を保存"}
          </Button>
          <SaveBanner status={bizStatus} />
        </div>
      </div>

      {/* セクション4: Webhook URL */}
      <div className="card p-5">
        <h2 className="font-semibold mb-2">Webhook URL</h2>
        <p className="text-xs mb-3" style={{ color: "var(--ink-soft)" }}>
          この URL を LINE Developers コンソールの Webhook URL に設定してください
        </p>
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg font-mono text-xs break-all"
          style={{ background: "rgba(26,26,46,0.04)", color: "var(--ink)" }}
        >
          <span className="flex-1">{WEBHOOK_URL}</span>
          <button
            onClick={copyWebhookUrl}
            className="flex-shrink-0 p-1.5 rounded transition-colors hover:bg-black/5"
            title="コピー"
          >
            {copied ? (
              <Check size={15} style={{ color: "var(--sage)" }} />
            ) : (
              <Copy size={15} style={{ color: "var(--ink-soft)" }} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
