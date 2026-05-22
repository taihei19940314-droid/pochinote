// ================================================================
// detectAvailableSlots 単体動作確認スクリプト
//
// 実行方法:
//   npx tsx src/lib/__tests__/availability.test.ts
//
// 全シナリオ ✅ PASS になることを確認してから API 実装に進むこと。
// ================================================================

import {
  detectAvailableSlots,
  jstDateTimeToUtc,
  getJstDateStr,
  type Booking,
  type BusinessSettings,
  type AvailableSlot,
} from "../availability.js";

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

function slotLabel(s: AvailableSlot): string {
  const start = new Date(s.start);
  const end = new Date(s.end);
  const fmt = (d: Date) => {
    const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    return `${String(jst.getUTCHours()).padStart(2, "0")}:${String(jst.getUTCMinutes()).padStart(2, "0")}`;
  };
  return `${s.date} ${fmt(start)}-${fmt(end)} (${s.duration_minutes}分, ${s.slot_count}枠)`;
}

const BASE_SETTINGS: BusinessSettings = {
  business_hours_start: "09:00",
  business_hours_end: "18:00",
  closed_weekdays: [],
  default_slot_minutes: 90,
  min_lead_time_minutes: 0,
};

// ─────────────────────────────────────────────────────────
// シナリオ1: 今日が日曜、closed_weekdays=[0]
//   → 今日(日曜)はスキップ、明日のみ検出
// ─────────────────────────────────────────────────────────
console.log("\n【シナリオ1】今日が日曜, closed_weekdays=[0]");

// 2026-05-24 は日曜日
const s1today = "2026-05-24";
const s1tomorrow = "2026-05-25";
const s1now = jstDateTimeToUtc(s1today, "10:00"); // 日曜 10:00 JST

const s1result = detectAvailableSlots({
  targetDates: [s1today, s1tomorrow],
  now: s1now,
  settings: { ...BASE_SETTINGS, closed_weekdays: [0] },
  bookings: [],
});

console.log("  結果:", s1result.map(slotLabel));
assert(
  "今日(日曜)の空き枠がゼロ",
  s1result.filter((s) => s.date === s1today).length === 0
);
assert(
  "明日の空き枠が1件以上",
  s1result.filter((s) => s.date === s1tomorrow).length > 0
);

// ─────────────────────────────────────────────────────────
// シナリオ2: 今 14:00 JST、min_lead_time=120
//   → 今日の 16:00 より前の枠は除外
//   予約なし、営業時間 9:00-18:00、1枠 90 分
//   期待: 16:00-18:00 = 120分 → 1枠(90分) のみ
// ─────────────────────────────────────────────────────────
console.log("\n【シナリオ2】今 14:00 JST、min_lead_time=120");

const s2today = "2026-05-26"; // 月曜
const s2now = jstDateTimeToUtc(s2today, "14:00");

const s2result = detectAvailableSlots({
  targetDates: [s2today],
  now: s2now,
  settings: { ...BASE_SETTINGS, min_lead_time_minutes: 120 },
  bookings: [],
});

console.log("  結果:", s2result.map(slotLabel));
// 16:00-18:00 = 120分 → slot_count = floor(120/90) = 1
assert("空き枠が1件", s2result.length === 1);
if (s2result.length >= 1) {
  const slot = s2result[0];
  const startJst = new Date(new Date(slot.start).getTime() + 9 * 3600_000);
  assert(
    "開始が 16:00 JST",
    startJst.getUTCHours() === 16 && startJst.getUTCMinutes() === 0,
    `実際: ${startJst.getUTCHours()}:${startJst.getUTCMinutes()}`
  );
  assert("duration_minutes = 120", slot.duration_minutes === 120, `実際: ${slot.duration_minutes}`);
  assert("slot_count = 1", slot.slot_count === 1, `実際: ${slot.slot_count}`);
}

// ─────────────────────────────────────────────────────────
// シナリオ3: 営業 9:00-18:00、予約「13:00-14:30」「16:00-17:30」、1枠 90 分
//   期待:
//   - 9:00-13:00 → 240分、slot_count=2
//   - 14:30-16:00 → 90分、slot_count=1
//   - 17:30-18:00 → 30分 → 除外
// ─────────────────────────────────────────────────────────
console.log("\n【シナリオ3】予約2件あり、1枠 90 分");

const s3date = "2026-05-26";
const s3now = jstDateTimeToUtc(s3date, "08:00"); // 営業開始前

const s3bookings: Booking[] = [
  {
    scheduled_at: jstDateTimeToUtc(s3date, "13:00").toISOString(),
    duration_min: 90,
    status: "confirmed",
  },
  {
    scheduled_at: jstDateTimeToUtc(s3date, "16:00").toISOString(),
    duration_min: 90,
    status: "confirmed",
  },
];

const s3result = detectAvailableSlots({
  targetDates: [s3date],
  now: s3now,
  settings: { ...BASE_SETTINGS, min_lead_time_minutes: 0 },
  bookings: s3bookings,
});

console.log("  結果:", s3result.map(slotLabel));
assert("空き枠が2件(3つ目は除外)", s3result.length === 2, `実際: ${s3result.length}件`);
if (s3result.length >= 1) {
  assert(
    "1件目: 9:00-13:00 240分 2枠",
    s3result[0].duration_minutes === 240 && s3result[0].slot_count === 2,
    `実際: ${s3result[0].duration_minutes}分 ${s3result[0].slot_count}枠`
  );
}
if (s3result.length >= 2) {
  assert(
    "2件目: 14:30-16:00 90分 1枠",
    s3result[1].duration_minutes === 90 && s3result[1].slot_count === 1,
    `実際: ${s3result[1].duration_minutes}分 ${s3result[1].slot_count}枠`
  );
}

// ─────────────────────────────────────────────────────────
// シナリオ4: closed_weekdays に翌日の曜日が含まれる
//   → 翌日はスキップ、今日のみ検出
// ─────────────────────────────────────────────────────────
console.log("\n【シナリオ4】翌日が定休日");

// 2026-05-26(火)が today、2026-05-27(水)が tomorrow → 水曜=3 を定休日に
const s4today = "2026-05-26";
const s4tomorrow = "2026-05-27";
const s4now = jstDateTimeToUtc(s4today, "08:00");

const s4result = detectAvailableSlots({
  targetDates: [s4today, s4tomorrow],
  now: s4now,
  settings: { ...BASE_SETTINGS, closed_weekdays: [3] }, // 水曜
  bookings: [],
});

console.log("  結果:", s4result.map(slotLabel));
assert(
  "翌日(水曜)の枠がゼロ",
  s4result.filter((s) => s.date === s4tomorrow).length === 0
);
assert(
  "今日(火曜)の枠が1件以上",
  s4result.filter((s) => s.date === s4today).length > 0
);

// ─────────────────────────────────────────────────────────
// シナリオ5: bookings の duration_min が NULL
//   → default_slot_minutes(90) で占有時間を計算
//   予約: 12:00 start、duration_min=null → 12:00-13:30 を占有
//   期待: 9:00-12:00(180分, 2枠)、13:30-18:00(270分, 3枠)
// ─────────────────────────────────────────────────────────
console.log("\n【シナリオ5】duration_min が NULL → default_slot_minutes(90)で計算");

const s5date = "2026-05-26";
const s5now = jstDateTimeToUtc(s5date, "08:00");

const s5bookings: Booking[] = [
  {
    scheduled_at: jstDateTimeToUtc(s5date, "12:00").toISOString(),
    duration_min: null,   // NULL → 90分として扱う
    status: "confirmed",
  },
];

const s5result = detectAvailableSlots({
  targetDates: [s5date],
  now: s5now,
  settings: { ...BASE_SETTINGS, min_lead_time_minutes: 0 },
  bookings: s5bookings,
});

console.log("  結果:", s5result.map(slotLabel));
assert("空き枠が2件", s5result.length === 2, `実際: ${s5result.length}件`);
if (s5result.length >= 1) {
  assert(
    "1件目: 9:00-12:00 180分 2枠",
    s5result[0].duration_minutes === 180 && s5result[0].slot_count === 2,
    `実際: ${s5result[0].duration_minutes}分 ${s5result[0].slot_count}枠`
  );
}
if (s5result.length >= 2) {
  assert(
    "2件目: 13:30-18:00 270分 3枠",
    s5result[1].duration_minutes === 270 && s5result[1].slot_count === 3,
    `実際: ${s5result[1].duration_minutes}分 ${s5result[1].slot_count}枠`
  );
}

// ─────────────────────────────────────────────────────────
// 集計
// ─────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(40)}`);
console.log(`結果: ${passed + failed} アサーション中 ${passed} PASS / ${failed} FAIL`);
if (failed === 0) {
  console.log("🎉 全シナリオ PASS — API 実装に進んで OK");
} else {
  console.log("🚫 FAIL あり — 修正してから次のステップへ進むこと");
  process.exit(1);
}
