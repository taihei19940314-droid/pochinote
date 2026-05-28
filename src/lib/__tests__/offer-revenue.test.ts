// ================================================================
// calculateMonthlyOfferRevenue 単体動作確認スクリプト
//
// 実行方法:
//   npx tsx src/lib/__tests__/offer-revenue.test.ts
// ================================================================

import { calculateMonthlyOfferRevenue } from "../offer-revenue.js";

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

// 基準: 2026-05-28 12:00 JST = UTC 2026-05-28T03:00:00Z (生の UTC Date を渡す)
const NOW_JST = new Date("2026-05-28T03:00:00Z");
// 今月内の日時(JST)
const THIS_MONTH = "2026-05-15T10:00:00+09:00";
// 先月の日時(JST)
const LAST_MONTH = "2026-04-20T10:00:00+09:00";
// 月初ちょうど(JST 5/1 00:00)
const MONTH_START = "2026-05-01T00:00:00+09:00";

type B = { scheduled_at: string; status: string; price: number | null; memo: string | null };

const OK: B = { scheduled_at: THIS_MONTH, status: "confirmed", price: 8800, memo: "LINE オファー経由" };

// ─── シナリオ1: memo 一致 + confirmed + 今月 + price=8800 ─────────
console.log("\n【シナリオ1】memo 一致 + confirmed + 今月 + price=8800 → 8800");
{
  const result = calculateMonthlyOfferRevenue([OK], NOW_JST);
  assert("8800 を返す", result === 8800, `実際: ${result}`);
}

// ─── シナリオ2: completed も加算される ────────────────────────────
console.log("\n【シナリオ2】completed + 今月 → 加算される");
{
  const b: B = { ...OK, status: "completed", price: 9000 };
  const result = calculateMonthlyOfferRevenue([OK, b], NOW_JST);
  assert("8800 + 9000 = 17800", result === 17800, `実際: ${result}`);
}

// ─── シナリオ3: price=NULL → 0 として加算 ─────────────────────────
console.log("\n【シナリオ3】price=NULL → 0 として加算");
{
  const b: B = { ...OK, price: null };
  const result = calculateMonthlyOfferRevenue([OK, b], NOW_JST);
  assert("8800 + 0 = 8800", result === 8800, `実際: ${result}`);
}

// ─── シナリオ4: memo 不一致 → 除外 ───────────────────────────────
console.log("\n【シナリオ4】memo 不一致(NULL / 別文字列) → 除外");
{
  const bNull: B = { ...OK, memo: null };
  const bOther: B = { ...OK, memo: "噛み癖あり" };
  const result = calculateMonthlyOfferRevenue([bNull, bOther], NOW_JST);
  assert("0 を返す", result === 0, `実際: ${result}`);
}

// ─── シナリオ5: 先月の scheduled_at → 除外 ───────────────────────
console.log("\n【シナリオ5】先月の scheduled_at → 除外");
{
  const b: B = { ...OK, scheduled_at: LAST_MONTH };
  const result = calculateMonthlyOfferRevenue([b], NOW_JST);
  assert("0 を返す", result === 0, `実際: ${result}`);
}

// ─── シナリオ6: status='cancelled' → 除外 ────────────────────────
console.log("\n【シナリオ6】status='cancelled' → 除外");
{
  const b: B = { ...OK, status: "cancelled" };
  const result = calculateMonthlyOfferRevenue([b], NOW_JST);
  assert("0 を返す", result === 0, `実際: ${result}`);
}

// ─── シナリオ7: 該当0件 → 0 を返す ──────────────────────────────
console.log("\n【シナリオ7】空配列 → 0 を返す");
{
  const result = calculateMonthlyOfferRevenue([], NOW_JST);
  assert("0 を返す", result === 0, `実際: ${result}`);
}

// ─── シナリオ8: 月初境界の両側を確認 ────────────────────────────
console.log("\n【シナリオ8】月初ちょうど(JST 5/1 00:00) → 今月に含む");
{
  // JST 5/1 00:00:00.000 = UTC 4/30 15:00:00.000
  const b: B = { ...OK, scheduled_at: "2026-05-01T00:00:00+09:00" };
  const result = calculateMonthlyOfferRevenue([b], NOW_JST);
  assert("8800 を返す(月初ちょうどは含む)", result === 8800, `実際: ${result}`);
}

console.log("\n【シナリオ8b】月初の1ms前(JST 4/30 23:59:59.999) → 先月として除外");
{
  // JST 4/30 23:59:59.999 = UTC 4/30 14:59:59.999
  const b: B = { ...OK, scheduled_at: "2026-04-30T14:59:59.999Z" };
  const result = calculateMonthlyOfferRevenue([b], NOW_JST);
  assert("0 を返す(月初1ms前は除外)", result === 0, `実際: ${result}`);
}

// ─── 集計 ─────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(40)}`);
console.log(`結果: ${passed + failed} アサーション中 ${passed} PASS / ${failed} FAIL`);
if (failed === 0) {
  console.log("🎉 全シナリオ PASS");
} else {
  console.log("🚫 FAIL あり");
  process.exit(1);
}
