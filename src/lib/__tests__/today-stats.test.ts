// ================================================================
// calculateTodayRevenue / calculateTodayUtilization 単体テスト
//
// 実行方法:
//   npx tsx src/lib/__tests__/today-stats.test.ts
// ================================================================

import { calculateTodayRevenue, calculateTodayUtilization, type BookingForStats } from "../today-stats.js";

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

// 基準: JST 5/29 14:00 = UTC 5/29 05:00
const NOW = new Date("2026-05-29T05:00:00Z");
const BIZ_START = "09:00:00";
const BIZ_END   = "18:00:00"; // 540分
const DEFAULT_SLOT = 90;

// 本日の booking ヘルパー(JST 5/29 の時刻を JST で指定)
function today(hour: number, min = 0): string {
  return `2026-05-29T${String(hour).padStart(2,"0")}:${String(min).padStart(2,"0")}:00+09:00`;
}
function yesterday(hour = 10): string {
  return `2026-05-28T${String(hour).padStart(2,"0")}:00:00+09:00`;
}
function tomorrow(hour = 10): string {
  return `2026-05-30T${String(hour).padStart(2,"0")}:00:00+09:00`;
}

type B = BookingForStats;

// ════════════════════════════════════════
// calculateTodayRevenue
// ════════════════════════════════════════

console.log("\n── calculateTodayRevenue ──────────────────");

// R1: 本日3件 completed (8800/5500/8800) → 23100
console.log("\n【R1】本日3件 completed → 23100");
{
  const bs: B[] = [
    { scheduled_at: today(9,30),  status: "completed", price: 5500, duration_min: 60 },
    { scheduled_at: today(12),    status: "completed", price: 8800, duration_min: 90 },
    { scheduled_at: today(15),    status: "completed", price: 8800, duration_min: 90 },
  ];
  const r = calculateTodayRevenue(bs, NOW);
  assert("23100", r === 23100, `実際: ${r}`);
}

// R2: 本日0件 → 0
console.log("\n【R2】本日0件 → 0");
{
  assert("0", calculateTodayRevenue([], NOW) === 0);
}

// R3: 全て cancelled → 0
console.log("\n【R3】本日3件全て cancelled → 0");
{
  const bs: B[] = [
    { scheduled_at: today(10), status: "cancelled", price: 8800, duration_min: 90 },
    { scheduled_at: today(12), status: "cancelled", price: 8800, duration_min: 90 },
    { scheduled_at: today(14), status: "cancelled", price: 8800, duration_min: 90 },
  ];
  assert("0", calculateTodayRevenue(bs, NOW) === 0);
}

// R4: confirmed(price NULL) + completed(8800) → 8800
console.log("\n【R4】confirmed(NULL) + completed(8800) → 8800");
{
  const bs: B[] = [
    { scheduled_at: today(10), status: "confirmed", price: null, duration_min: 90 },
    { scheduled_at: today(13), status: "completed", price: 8800, duration_min: 90 },
  ];
  const r = calculateTodayRevenue(bs, NOW);
  assert("8800", r === 8800, `実際: ${r}`);
}

// R5: JST 月初罠 — JST 5/1 00:30 の booking を JST 5/1 14:00 の now で → 5000
console.log("\n【R5】JST 月初罠: now=JST 5/1 14:00、booking=JST 5/1 00:30 → 5000");
{
  const nowMay1 = new Date("2026-04-30T15:30:00Z"); // JST 5/1 00:30 — wait, 14:00 JST = UTC 5:00
  // nowMay1 should be JST 5/1 14:00 = UTC 5/1 05:00
  const nowJst51 = new Date("2026-05-01T05:00:00Z"); // JST 5/1 14:00
  const bs: B[] = [
    { scheduled_at: "2026-05-01T00:30:00+09:00", status: "confirmed", price: 5000, duration_min: 60 },
  ];
  const r = calculateTodayRevenue(bs, nowJst51);
  assert("5000(今日に含む)", r === 5000, `実際: ${r}`);
}

// R6: 昨日・明日の completed は除外
console.log("\n【R6】昨日・明日の bookings は除外");
{
  const bs: B[] = [
    { scheduled_at: yesterday(), status: "completed", price: 8800, duration_min: 90 },
    { scheduled_at: tomorrow(),  status: "completed", price: 8800, duration_min: 90 },
  ];
  assert("0(他日除外)", calculateTodayRevenue(bs, NOW) === 0);
}

// ════════════════════════════════════════
// calculateTodayUtilization
// ════════════════════════════════════════

console.log("\n── calculateTodayUtilization ──────────────");

// U1: 60+90+90=240分 / 540分 → 44%
console.log("\n【U1】240分 / 540分 → 44%");
{
  const bs: B[] = [
    { scheduled_at: today(9,30),  status: "completed", price: 5500,  duration_min: 60 },
    { scheduled_at: today(12),    status: "completed", price: 8800,  duration_min: 90 },
    { scheduled_at: today(15),    status: "completed", price: 8800,  duration_min: 90 },
  ];
  const r = calculateTodayUtilization(bs, BIZ_START, BIZ_END, DEFAULT_SLOT, NOW);
  assert("44", r === 44, `実際: ${r}`);
}

// U2: 0件 → 0%
console.log("\n【U2】0件 → 0%");
{
  assert("0", calculateTodayUtilization([], BIZ_START, BIZ_END, DEFAULT_SLOT, NOW) === 0);
}

// U3: duration_min=NULL 1件 → default_slot_minutes=90 で補完 → 90/540=17%
console.log("\n【U3】duration_min=NULL → defaultSlotMinutes=90 で補完 → 17%");
{
  const bs: B[] = [
    { scheduled_at: today(10), status: "confirmed", price: null, duration_min: null },
  ];
  const r = calculateTodayUtilization(bs, BIZ_START, BIZ_END, 90, NOW);
  assert("17", r === 17, `実際: ${r}`);
}

// U4: cancelled は分子に入らない
console.log("\n【U4】cancelled は分子に入らない");
{
  const bs: B[] = [
    { scheduled_at: today(10), status: "completed", price: 5500, duration_min: 90 },
    { scheduled_at: today(13), status: "cancelled", price: 8800, duration_min: 90 },
  ];
  const r = calculateTodayUtilization(bs, BIZ_START, BIZ_END, DEFAULT_SLOT, NOW);
  // 90/540 = 17%
  assert("17(cancelledは除外)", r === 17, `実際: ${r}`);
}

// U5: 600分 / 540分 → 100%にクランプ
console.log("\n【U5】超過(600分/540分) → 100%にクランプ");
{
  const bs: B[] = Array.from({ length: 4 }, (_, i) => ({
    scheduled_at: today(9 + i * 2),
    status: "completed" as const,
    price: 8800,
    duration_min: 150,
  }));
  const r = calculateTodayUtilization(bs, BIZ_START, BIZ_END, DEFAULT_SLOT, NOW);
  assert("100(クランプ)", r === 100, `実際: ${r}`);
}

// U6: 分母0(business_hours_start === end) → 0
console.log("\n【U6】分母0(start=end) → 0");
{
  const bs: B[] = [
    { scheduled_at: today(10), status: "completed", price: 8800, duration_min: 90 },
  ];
  assert("0(0除算回避)", calculateTodayUtilization(bs, "09:00", "09:00", DEFAULT_SLOT, NOW) === 0);
}

// U7: "09:00:00" 形式でも "09:00" 形式でも同じ結果
console.log("\n【U7】HH:MM:SS 形式でも HH:MM 形式でも同じ結果");
{
  const bs: B[] = [
    { scheduled_at: today(10), status: "completed", price: 8800, duration_min: 90 },
  ];
  const r1 = calculateTodayUtilization(bs, "09:00:00", "18:00:00", DEFAULT_SLOT, NOW);
  const r2 = calculateTodayUtilization(bs, "09:00",    "18:00",    DEFAULT_SLOT, NOW);
  assert("同一結果(17%)", r1 === r2 && r1 === 17, `r1=${r1} r2=${r2}`);
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
