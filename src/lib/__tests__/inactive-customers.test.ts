// ================================================================
// detectInactiveCustomers 単体動作確認スクリプト
//
// 実行方法:
//   npx tsx src/lib/__tests__/inactive-customers.test.ts
//
// 全シナリオ ✅ PASS になることを確認してから API 実装に進むこと。
// ================================================================

import {
  detectInactiveCustomers,
  type CustomerRow,
  type PetRow,
  type RecentOfferRow,
} from "../inactive-customers.js";

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

// 基準時刻: 2026-05-22 12:00 JST
const NOW = new Date("2026-05-22T03:00:00Z"); // UTC

// ヘルパー: 指定日数前の ISO 8601 文字列を生成
function daysAgo(days: number): string {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

const BASE_CUSTOMER: CustomerRow = {
  id: "c1",
  name: "田中 花子",
  line_user_id: "U123",
  line_follow_status: "followed",
  last_visit_at: daysAgo(70), // 70日前
};

const BASE_PET: PetRow = {
  customer_id: "c1",
  name: "こてつ",
  breed: "トイプードル",
};

const BASE_ARGS = {
  now: NOW,
  customers: [BASE_CUSTOMER],
  pets: [BASE_PET],
  recentOffers: [] as RecentOfferRow[],
  inactiveThresholdDays: 60,
  minResendIntervalDays: 7,
};

// ─────────────────────────────────────────────────────────
// シナリオ1: last_visit_at が閾値を超えた顧客が含まれる
//   70日前に来店、閾値 60日 → 対象
// ─────────────────────────────────────────────────────────
console.log("\n【シナリオ1】70日前来店、閾値60日 → 対象に含まれる");

const s1 = detectInactiveCustomers(BASE_ARGS);
console.log("  結果:", s1.map((c) => `${c.customerName}(${c.daysSinceLastVisit}日)`));
assert("候補が1件", s1.length === 1, `実際: ${s1.length}件`);
assert("daysSinceLastVisit = 70", s1[0]?.daysSinceLastVisit === 70, `実際: ${s1[0]?.daysSinceLastVisit}`);
assert("petName = こてつ", s1[0]?.petName === "こてつ");

// ─────────────────────────────────────────────────────────
// シナリオ2: last_visit_at が閾値以内 → 除外
//   30日前に来店、閾値 60日 → 対象外
// ─────────────────────────────────────────────────────────
console.log("\n【シナリオ2】30日前来店、閾値60日 → 除外される");

const s2 = detectInactiveCustomers({
  ...BASE_ARGS,
  customers: [{ ...BASE_CUSTOMER, last_visit_at: daysAgo(30) }],
});
console.log("  結果:", s2.length, "件");
assert("候補が0件", s2.length === 0);

// ─────────────────────────────────────────────────────────
// シナリオ3: line_follow_status が 'unfollowed' → 除外
// ─────────────────────────────────────────────────────────
console.log("\n【シナリオ3】line_follow_status='unfollowed' → 除外");

const s3 = detectInactiveCustomers({
  ...BASE_ARGS,
  customers: [{ ...BASE_CUSTOMER, line_follow_status: "unfollowed" }],
});
assert("候補が0件", s3.length === 0);

// blocked も同様に除外
const s3b = detectInactiveCustomers({
  ...BASE_ARGS,
  customers: [{ ...BASE_CUSTOMER, line_follow_status: "blocked" }],
});
assert("blocked も除外", s3b.length === 0);

// ─────────────────────────────────────────────────────────
// シナリオ4: line_user_id が NULL → 除外
// ─────────────────────────────────────────────────────────
console.log("\n【シナリオ4】line_user_id=NULL → 除外");

const s4 = detectInactiveCustomers({
  ...BASE_ARGS,
  customers: [{ ...BASE_CUSTOMER, line_user_id: null }],
});
assert("候補が0件", s4.length === 0);

// ─────────────────────────────────────────────────────────
// シナリオ5: last_visit_at が NULL → 除外(未来店客はオファー対象外)
// ─────────────────────────────────────────────────────────
console.log("\n【シナリオ5】last_visit_at=NULL → 除外(未来店客はオファー対象外)");

const s5 = detectInactiveCustomers({
  ...BASE_ARGS,
  customers: [{ ...BASE_CUSTOMER, last_visit_at: null }],
});
assert("候補が0件(NULL は除外)", s5.length === 0);

// ─────────────────────────────────────────────────────────
// シナリオ6: recentOffers に含まれる顧客 → 再送禁止で除外
// ─────────────────────────────────────────────────────────
console.log("\n【シナリオ6】recentOffers に含まれる → 再送禁止で除外");

const s6 = detectInactiveCustomers({
  ...BASE_ARGS,
  recentOffers: [{ customer_id: "c1", sent_at: daysAgo(3) }],
});
assert("候補が0件(再送禁止)", s6.length === 0);

// recentOffers に含まれない別の customer_id は通過する
const s6b = detectInactiveCustomers({
  ...BASE_ARGS,
  customers: [
    BASE_CUSTOMER,
    { id: "c2", name: "鈴木 太郎", line_user_id: "U456", line_follow_status: "followed", last_visit_at: daysAgo(80) },
  ],
  pets: [BASE_PET, { customer_id: "c2", name: "ぽち", breed: null }],
  recentOffers: [{ customer_id: "c1", sent_at: daysAgo(3) }],
});
assert("c1 は除外、c2 は通過(1件)", s6b.length === 1 && s6b[0].customerId === "c2");

// ─────────────────────────────────────────────────────────
// シナリオ7: 離脱日数の降順でソートされている
//   c1=70日, c2=90日, c3=65日 → c2, c1, c3 の順
// ─────────────────────────────────────────────────────────
console.log("\n【シナリオ7】複数顧客が離脱日数の降順でソートされる");

const s7 = detectInactiveCustomers({
  ...BASE_ARGS,
  customers: [
    { id: "c1", name: "田中", line_user_id: "U1", line_follow_status: "followed", last_visit_at: daysAgo(70) },
    { id: "c2", name: "鈴木", line_user_id: "U2", line_follow_status: "followed", last_visit_at: daysAgo(90) },
    { id: "c3", name: "佐藤", line_user_id: "U3", line_follow_status: "followed", last_visit_at: daysAgo(65) },
  ],
  pets: [
    { customer_id: "c1", name: "こてつ", breed: null },
    { customer_id: "c2", name: "ぽち",   breed: null },
    { customer_id: "c3", name: "もも",   breed: null },
  ],
});
console.log("  結果順:", s7.map((c) => `${c.customerName}(${c.daysSinceLastVisit}日)`));
assert("3件返る", s7.length === 3);
assert("1位: 鈴木(90日)", s7[0]?.customerId === "c2", `実際: ${s7[0]?.customerId}`);
assert("2位: 田中(70日)", s7[1]?.customerId === "c1", `実際: ${s7[1]?.customerId}`);
assert("3位: 佐藤(65日)", s7[2]?.customerId === "c3", `実際: ${s7[2]?.customerId}`);

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
