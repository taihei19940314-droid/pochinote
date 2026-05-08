"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

type Status = "idle" | "submitting" | "success" | "error" | "duplicate";

export default function BetaSignupForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");

    const supabase = createClient();
    const { error } = await supabase.from("beta_signups").insert({ email });

    if (!error) {
      setStatus("success");
    } else if (error.code === "23505") {
      setStatus("duplicate");
    } else {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center py-4" style={{ color: "var(--terra)" }}>
        <div className="text-4xl mb-3">✅</div>
        <p className="font-semibold text-base">お申し込みありがとうございます！</p>
        <p className="text-sm mt-1" style={{ color: "var(--ink-soft)" }}>ご連絡をお待ちください。</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-3 max-w-md mx-auto">
        <input
          type="email"
          placeholder="メールアドレス"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "submitting"}
          className="flex-1 px-4 py-3 rounded-lg border text-sm outline-none"
          style={{ borderColor: "rgba(26,26,46,0.15)", background: "white" }}
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="px-5 py-3 rounded-lg text-sm font-semibold whitespace-nowrap transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: "var(--terra)", color: "white" }}
        >
          {status === "submitting" ? "送信中…" : "申し込む →"}
        </button>
      </div>
      <p className="text-xs mt-4" style={{ color: "var(--ink-soft)" }}>スパムは送りません。いつでも登録解除できます。</p>
      {status === "duplicate" && (
        <p className="text-xs mt-2" style={{ color: "#c0392b" }}>このメールアドレスは既に登録されています。</p>
      )}
      {status === "error" && (
        <p className="text-xs mt-2" style={{ color: "#c0392b" }}>送信に失敗しました。もう一度お試しください。</p>
      )}
    </form>
  );
}
