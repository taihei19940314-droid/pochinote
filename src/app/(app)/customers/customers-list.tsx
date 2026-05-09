"use client";

import { useState } from "react";
import Link from "next/link";

export interface Pet {
  id: string;
  name: string;
  breed: string | null;
  gender: string | null;
  birth_date: string | null;
  weight_kg: number | null;
  notes: string | null;
  rabies_vaccination_date: string | null;
}

export interface CustomerRow {
  id: string;
  name: string;
  phone: string | null;
  line_user_id: string | null;
  pets: Pet[];
  lastVisitDate: string | null;
}

type Filter = "all" | "recent" | "overdue";

function rabiesExpired(date: string | null): boolean {
  if (!date) return false;
  const ms = Date.now() - new Date(date).getTime();
  return ms > 365 * 24 * 60 * 60 * 1000;
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export default function CustomersList({
  customers,
  registered,
}: {
  customers: CustomerRow[];
  registered?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const now = Date.now();
  const day = 1000 * 60 * 60 * 24;

  const filtered = customers.filter((c) => {
    const pet = c.pets[0];
    const q = query.toLowerCase();
    if (q && !c.name.toLowerCase().includes(q) && !(pet?.name ?? "").toLowerCase().includes(q)) {
      return false;
    }
    if (filter === "recent") {
      if (!c.lastVisitDate) return false;
      return now - new Date(c.lastVisitDate).getTime() <= 30 * day;
    }
    if (filter === "overdue") {
      if (!c.lastVisitDate) return true;
      return now - new Date(c.lastVisitDate).getTime() > 90 * day;
    }
    return true;
  });

  const tabs: { key: Filter; label: string }[] = [
    { key: "all", label: "全員" },
    { key: "recent", label: "1ヶ月以内" },
    { key: "overdue", label: "3ヶ月以上 / 未来店" },
  ];

  return (
    <div>
      {registered && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm font-medium" style={{ background: "rgba(107,142,127,0.15)", color: "var(--sage)" }}>
          ✓ 顧客を登録しました
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="飼い主名・ペット名で検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
          style={{ borderColor: "rgba(26,26,46,0.12)", background: "white", color: "var(--ink)" }}
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={
              filter === t.key
                ? { background: "var(--terra)", color: "white" }
                : { background: "rgba(26,26,46,0.06)", color: "var(--ink-soft)" }
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">🐾</div>
          <p className="text-sm mb-4" style={{ color: "var(--ink-soft)" }}>
            {customers.length === 0 ? "まだ顧客が登録されていません" : "該当する顧客が見つかりません"}
          </p>
          <Link href="/customers/new">
            <span className="inline-flex items-center gap-1 px-5 py-2.5 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: "var(--terra)", color: "white" }}>
              + 新規登録
            </span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => {
            const pet = c.pets[0];
            const days = daysSince(c.lastVisitDate);
            const urgent = days === null || days >= 60;
            const rabiesWarn = pet ? rabiesExpired(pet.rabies_vaccination_date) : false;

            return (
              <Link key={c.id} href={`/customers/${c.id}`}>
                <div
                  className="card p-5 flex items-center gap-4 cursor-pointer transition-all hover:shadow-md"
                  style={{ borderLeft: `3px solid ${urgent ? "var(--terra)" : "transparent"}` }}
                >
                  <div className="text-3xl w-12 h-12 flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ background: "var(--paper-warm)" }}>
                    🐕
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-sm">{pet?.name ?? "—"}</span>
                      {pet?.breed && (
                        <span className="text-xs" style={{ color: "var(--ink-soft)" }}>/ {pet.breed}</span>
                      )}
                      {rabiesWarn && (
                        <span className="pill text-[10px]" style={{ background: "rgba(192,57,43,0.12)", color: "#c0392b" }}>
                          ⚠ 狂犬病ワクチン期限切れ
                        </span>
                      )}
                    </div>
                    <div className="text-xs" style={{ color: "var(--ink-soft)" }}>{c.name}</div>
                    {pet?.notes && (
                      <div className="text-xs mt-0.5 pill" style={{ background: "rgba(200,155,60,0.15)", color: "var(--gold)" }}>
                        ⚠ {pet.notes.slice(0, 20)}{pet.notes.length > 20 ? "…" : ""}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    {days === null ? (
                      <div className="text-xs font-mono" style={{ color: "var(--terra)" }}>未来店</div>
                    ) : (
                      <div className="text-xs font-mono" style={{ color: urgent ? "var(--terra)" : "var(--ink-soft)" }}>
                        {days}日前
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
