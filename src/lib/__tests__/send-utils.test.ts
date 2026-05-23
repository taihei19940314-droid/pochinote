// ================================================================
// send-utils / build-flex-message 単体動作確認スクリプト
//
// 実行方法:
//   npx tsx src/lib/__tests__/send-utils.test.ts
// ================================================================

import { isResendBlocked, toJstDatetime } from "../line/send-utils.js";
import { buildFlexMessage } from "../line/build-flex-message.js";

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

const NOW = new Date("2026-05-23T01:00:00Z"); // 2026-05-23 10:00 JST

// ─── isResendBlocked ───────────────────────────────────────────
console.log("\n【isResendBlocked】");

assert(
  "NULL は非ブロック",
  isResendBlocked(null, 7, NOW) === false
);
assert(
  "3日前: ブロック(閾値7日)",
  isResendBlocked("2026-05-20T01:00:00Z", 7, NOW) === true
);
assert(
  "8日前: 非ブロック(閾値7日)",
  isResendBlocked("2026-05-15T01:00:00Z", 7, NOW) === false
);
assert(
  "ちょうど7日前(1ms余裕): 非ブロック",
  isResendBlocked(new Date(NOW.getTime() - 7 * 24 * 60 * 60 * 1000 - 1).toISOString(), 7, NOW) === false
);
assert(
  "6日23時間: ブロック",
  isResendBlocked(new Date(NOW.getTime() - (7 * 24 * 60 * 60 * 1000 - 1)).toISOString(), 7, NOW) === true
);

// ─── toJstDatetime ────────────────────────────────────────────
console.log("\n【toJstDatetime】");

const utcFriday = new Date("2026-05-22T07:30:00Z"); // 2026-05-22 16:30 JST(金)
const jst = toJstDatetime(utcFriday);
assert("date = 5/22(金)", jst.date === "5/22(金)", `実際: ${jst.date}`);
assert("time = 16:30", jst.time === "16:30", `実際: ${jst.time}`);

const utcMidnight = new Date("2026-05-22T15:00:00Z"); // 2026-05-23 00:00 JST(土)
const jstMidnight = toJstDatetime(utcMidnight);
assert("日付をまたぐ変換 = 5/23(土)", jstMidnight.date === "5/23(土)", `実際: ${jstMidnight.date}`);
assert("真夜中 = 00:00", jstMidnight.time === "00:00", `実際: ${jstMidnight.time}`);

// ─── buildFlexMessage ────────────────────────────────────────
console.log("\n【buildFlexMessage】");

const msg = buildFlexMessage({
  bodyText: "モカちゃん、久しぶりです！空き枠があります。",
  petName: "モカ",
  recipientId: "rec-abc-123",
});

assert("type = flex", msg.type === "flex");
assert("altText にペット名を含む", msg.altText.includes("モカ"), `実際: ${msg.altText}`);

const contents = msg.contents as Record<string, unknown>;
assert("bubble container", contents.type === "bubble");

const body = contents.body as Record<string, unknown>;
const bodyContents = body.contents as Array<Record<string, unknown>>;
assert("body に text が1つ", bodyContents.length === 1 && bodyContents[0].type === "text");
assert("body text がメッセージ内容", bodyContents[0].text === "モカちゃん、久しぶりです！空き枠があります。");

const footer = contents.footer as Record<string, unknown>;
const footerContents = footer.contents as Array<Record<string, unknown>>;
assert("footer ボタン2つ", footerContents.length === 2);

const bookAction = (footerContents[0] as Record<string, unknown>).action as Record<string, string>;
assert("予約ボタン: label=予約する", bookAction.label === "予約する");
assert("予約ボタン: data に recipientId を含む", bookAction.data.includes("rec-abc-123"));
assert("予約ボタン: data に action=book", bookAction.data.includes("action=book"));

const passAction = (footerContents[1] as Record<string, unknown>).action as Record<string, string>;
assert("パスボタン: label=今回はパス", passAction.label === "今回はパス");
assert("パスボタン: data に action=pass", passAction.data.includes("action=pass"));

// ─── 集計 ────────────────────────────────────────────────────
console.log(`\n${"─".repeat(40)}`);
console.log(`結果: ${passed + failed} アサーション中 ${passed} PASS / ${failed} FAIL`);
if (failed === 0) {
  console.log("🎉 全シナリオ PASS — API 実装に進んで OK");
} else {
  console.log("🚫 FAIL あり — 修正してから次のステップへ進むこと");
  process.exit(1);
}
