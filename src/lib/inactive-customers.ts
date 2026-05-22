// ================================================================
// 離脱気味の常連検出ロジック — 純粋関数
// DB アクセス・Date.now() 禁止。引数で全てを受け取る。
// ================================================================

export type CustomerRow = {
  id: string;
  name: string;
  line_user_id: string | null;
  line_follow_status: string | null;
  last_visit_at: string | null; // ISO 8601
};

export type PetRow = {
  customer_id: string;
  name: string;
  breed: string | null;
};

export type RecentOfferRow = {
  customer_id: string;
  sent_at: string; // ISO 8601
};

export type InactiveCustomer = {
  customerId: string;
  customerName: string;
  petName: string;
  petBreed: string | null;
  lastVisitAt: Date;
  daysSinceLastVisit: number;
  lineUserId: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function detectInactiveCustomers(args: {
  now: Date;
  customers: CustomerRow[];
  pets: PetRow[];
  recentOffers: RecentOfferRow[];
  inactiveThresholdDays: number;
  minResendIntervalDays: number;
}): InactiveCustomer[] {
  const { now, customers, pets, recentOffers, inactiveThresholdDays } = args;

  console.log(`[DEBUG inactive] start: ${customers.length} customers, threshold=${inactiveThresholdDays}d, now=${now.toISOString()}`);

  // 再送禁止対象の customer_id を Set で引く
  const recentlySentIds = new Set(recentOffers.map((o) => o.customer_id));

  // ペットを customer_id → 最初の1件 で引ける Map を構築
  const petMap = new Map<string, PetRow>();
  for (const pet of pets) {
    if (!petMap.has(pet.customer_id)) {
      petMap.set(pet.customer_id, pet);
    }
  }

  const results: InactiveCustomer[] = [];

  for (const c of customers) {
    // 1. line_user_id が NULL → 除外
    if (!c.line_user_id) {
      console.log(`[DEBUG inactive] SKIP ${c.name}: line_user_id=NULL`);
      continue;
    }

    // 2. line_follow_status が 'followed' 以外 → 除外
    if (c.line_follow_status !== "followed") {
      console.log(`[DEBUG inactive] SKIP ${c.name}: follow_status=${c.line_follow_status}`);
      continue;
    }

    // 3. last_visit_at が NULL → 除外(未来店客はオファー対象外)
    if (!c.last_visit_at) {
      console.log(`[DEBUG inactive] SKIP ${c.name}: last_visit_at=NULL`);
      continue;
    }

    // 4. 離脱判定: now - last_visit_at >= inactiveThresholdDays
    const lastVisitAt = new Date(c.last_visit_at);
    const daysSinceLastVisit = Math.floor(
      (now.getTime() - lastVisitAt.getTime()) / MS_PER_DAY
    );
    if (daysSinceLastVisit < inactiveThresholdDays) {
      console.log(`[DEBUG inactive] SKIP ${c.name}: days=${daysSinceLastVisit} < threshold=${inactiveThresholdDays}`);
      continue;
    }

    // 5. 再送禁止期間内に送信履歴あり → 除外
    if (recentlySentIds.has(c.id)) {
      console.log(`[DEBUG inactive] SKIP ${c.name}: recently sent`);
      continue;
    }

    console.log(`[DEBUG inactive] PASS ${c.name}: days=${daysSinceLastVisit}, last_visit_at=${c.last_visit_at}`);

    const pet = petMap.get(c.id);
    results.push({
      customerId: c.id,
      customerName: c.name,
      petName: pet?.name ?? "—",
      petBreed: pet?.breed ?? null,
      lastVisitAt,
      daysSinceLastVisit,
      lineUserId: c.line_user_id,
    });
  }

  // 6. 離脱日数の降順でソート
  results.sort((a, b) => b.daysSinceLastVisit - a.daysSinceLastVisit);

  console.log(`[DEBUG inactive] result: ${results.length} candidates`);

  return results;
}
