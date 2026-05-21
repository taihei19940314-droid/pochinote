"use client";

import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, X } from "lucide-react";

interface Props {
  addFriendUrl: string | null;
  onClose: () => void;
}

export function LineAddFriendModal({ addFriendUrl, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!addFriendUrl) return;
    await navigator.clipboard.writeText(addFriendUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(26,26,46,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "var(--paper)" }}>
        {/* ヘッダー */}
        <div className="flex items-start justify-between mb-4">
          <h2 className="font-semibold text-lg leading-snug">LINE 連携をご依頼ください</h2>
          <button onClick={onClose} className="p-1 rounded transition-colors hover:bg-black/5 ml-2 flex-shrink-0">
            <X size={18} style={{ color: "var(--ink-soft)" }} />
          </button>
        </div>

        {addFriendUrl ? (
          <>
            {/* 説明文 */}
            <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              お客様にこの QR コードを読み取ってもらってください。
            </p>

            {/* QR コード */}
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-xl bg-white shadow-sm">
                <QRCodeSVG value={addFriendUrl} size={180} />
              </div>
            </div>

            {/* URL + コピーボタン */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg font-mono text-xs break-all mb-4"
              style={{ background: "rgba(26,26,46,0.04)" }}
            >
              <span className="flex-1" style={{ color: "var(--ink)" }}>{addFriendUrl}</span>
              <button
                onClick={handleCopy}
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

            {/* 案内文 */}
            <div className="px-3 py-2.5 rounded-lg text-xs leading-relaxed mb-5"
              style={{ background: "rgba(107,142,127,0.1)", color: "var(--ink)" }}>
              友だち追加後、最初のメッセージで<br />
              <strong>「お名前 / ワンちゃんのお名前」</strong>をお送りいただくようご案内ください。<br />
              <span style={{ color: "var(--ink-soft)" }}>例: 佐藤花子 / こてつ</span>
            </div>
          </>
        ) : (
          /* 友だち追加 URL 未設定の場合 */
          <div className="py-6 text-center mb-5">
            <p className="text-sm leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              先に LINE 連携設定で「友だち追加 URL」を登録してください。
            </p>
            <Link
              href="/line/settings"
              onClick={onClose}
              className="inline-block mt-3 text-sm font-semibold underline"
              style={{ color: "var(--terra)" }}
            >
              LINE 連携設定を開く →
            </Link>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-lg text-sm font-semibold border transition-colors hover:bg-black/5"
          style={{ borderColor: "rgba(26,26,46,0.2)" }}
        >
          閉じる
        </button>
      </div>
    </div>
  );
}
