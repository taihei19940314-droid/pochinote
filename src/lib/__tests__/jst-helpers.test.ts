// ================================================================
// getJstDayRange 単体動作確認スクリプト
//
// 実行方法:
//   npx tsx src/lib/__tests__/jst-helpers.test.ts
// ================================================================

import { getJstDayRange } from "../jst-helpers.js";

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

function isoUtc(d: Date) { return d.toISOString(); }

// 既存ダッシュ計算(getJstNow+getFullYear方式)の同値関数
// dashboard/page.tsx L65-70 と同じロジック
function legacyJstMidnight(nowUtc: Date): Date {
  // getJstNow() = new Date(nowUtc.toLocaleString("en-US",{timeZone:"Asia/Tokyo"}))
  // その Date に getFullYear/Month/Date を呼ぶと JST 年月日が得られる
  const jstStr = nowUtc.toLocaleString("en-US", { timeZone: "Asia/Tokyo" });
  const jstDate = new Date(jstStr);
  const jstOffsetMs = 9 * 60 * 60 * 1000;
  return new Date(
    Date.UTC(jstDate.getFullYear(), jstDate.getMonth(), jstDate.getDate()) - jstOffsetMs
  );
}

// ─── シナリオ1: JST 5/29 14:00 ───────────────────────────────────
console.log("\n【シナリオ1】JST 5/29 14:00(UTC 5/29 05:00)");
{
  const now = new Date("2026-05-29T05:00:00Z");
  const { dayStart, dayEnd } = getJstDayRange(now);
  // JST 5/29 00:00 = UTC 5/28 15:00
  assert("dayStart = JST 5/29 00:00", isoUtc(dayStart) === "2026-05-28T15:00:00.000Z", isoUtc(dayStart));
  // JST 5/30 00:00 = UTC 5/29 15:00
  assert("dayEnd = JST 5/30 00:00",   isoUtc(dayEnd)   === "2026-05-29T15:00:00.000Z", isoUtc(dayEnd));
}

// ─── シナリオ2: JST 5/29 00:00 ちょうど(境界) ───────────────────
console.log("\n【シナリオ2】JST 5/29 00:00 ちょうど(境界)");
{
  const now = new Date("2026-05-28T15:00:00.000Z"); // JST 5/29 00:00
  const { dayStart } = getJstDayRange(now);
  assert("dayStart = JST 5/29 00:00", isoUtc(dayStart) === "2026-05-28T15:00:00.000Z", isoUtc(dayStart));
}

// ─── シナリオ3: JST 5/29 23:59:59.999(境界1ms前) ────────────────
console.log("\n【シナリオ3】JST 5/29 23:59:59.999(境界1ms前)");
{
  const now = new Date("2026-05-29T14:59:59.999Z"); // JST 5/29 23:59:59.999
  const { dayStart } = getJstDayRange(now);
  assert("dayStart = JST 5/29 00:00(まだ5/29)", isoUtc(dayStart) === "2026-05-28T15:00:00.000Z", isoUtc(dayStart));
}

// ─── シナリオ4: JST 月初罠 — JST 5/1 00:30(UTC 4/30 15:30) ──────
console.log("\n【シナリオ4】JST 月初罠: JST 5/1 00:30(UTC 4/30 15:30)");
{
  const now = new Date("2026-04-30T15:30:00Z"); // JST 5/1 00:30
  const { dayStart } = getJstDayRange(now);
  // JST 5/1 00:00 = UTC 4/30 15:00
  assert("dayStart = JST 5/1 00:00(前月にならない)", isoUtc(dayStart) === "2026-04-30T15:00:00.000Z", isoUtc(dayStart));
}

// ─── シナリオ5: JST 月末罠 — JST 4/30 23:30(UTC 4/30 14:30) ─────
console.log("\n【シナリオ5】JST 月末罠: JST 4/30 23:30(UTC 4/30 14:30)");
{
  const now = new Date("2026-04-30T14:30:00Z"); // JST 4/30 23:30
  const { dayStart } = getJstDayRange(now);
  // JST 4/30 00:00 = UTC 4/29 15:00
  assert("dayStart = JST 4/30 00:00", isoUtc(dayStart) === "2026-04-29T15:00:00.000Z", isoUtc(dayStart));
}

// ─── 同値性テスト: getJstDayRange.dayStart === 既存 jstMidnightUtc ─
console.log("\n【同値性1】JST 月初 0:30: 新旧計算が一致");
{
  const now = new Date("2026-04-30T15:30:00Z"); // JST 5/1 00:30
  const { dayStart } = getJstDayRange(now);
  const legacy = legacyJstMidnight(now);
  assert("新旧の dayStart が同値", isoUtc(dayStart) === isoUtc(legacy),
    `新: ${isoUtc(dayStart)} / 旧: ${isoUtc(legacy)}`);
}

console.log("\n【同値性2】JST 月末 23:30: 新旧計算が一致");
{
  const now = new Date("2026-05-31T14:30:00Z"); // JST 5/31 23:30
  const { dayStart } = getJstDayRange(now);
  const legacy = legacyJstMidnight(now);
  assert("新旧の dayStart が同値", isoUtc(dayStart) === isoUtc(legacy),
    `新: ${isoUtc(dayStart)} / 旧: ${isoUtc(legacy)}`);
}

console.log("\n【同値性3】JST 通常日 14:00: 新旧計算が一致");
{
  const now = new Date("2026-05-29T05:00:00Z"); // JST 5/29 14:00
  const { dayStart } = getJstDayRange(now);
  const legacy = legacyJstMidnight(now);
  assert("新旧の dayStart が同値", isoUtc(dayStart) === isoUtc(legacy),
    `新: ${isoUtc(dayStart)} / 旧: ${isoUtc(legacy)}`);
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
