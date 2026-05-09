import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import CustomersList, { CustomerRow } from "./customers-list";

// TODO: 認証実装後、ログイン中のサロンIDに置き換える
const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const { registered } = await searchParams;
  const supabase = await createClient();

  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, phone, line_user_id, pets(id, name, breed, gender, birth_date, weight_kg, notes, rabies_vaccination_date)")
    .eq("salon_id", DEFAULT_SALON_ID)
    .order("created_at", { ascending: false });

  // Try to get last booking date per customer (graceful fallback if table doesn't exist)
  let lastVisitMap: Record<string, string> = {};
  try {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("customer_id, date")
      .order("date", { ascending: false });
    if (bookings) {
      for (const b of bookings) {
        if (!lastVisitMap[b.customer_id]) lastVisitMap[b.customer_id] = b.date;
      }
    }
  } catch {
    // bookings table doesn't exist yet — all customers treated as 未来店
  }

  const rows: CustomerRow[] = (customers ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    line_user_id: c.line_user_id,
    pets: (c.pets as CustomerRow["pets"]) ?? [],
    lastVisitDate: lastVisitMap[c.id] ?? null,
  }));

  return (
    <div className="max-w-3xl mx-auto py-8 px-2">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-semibold tracking-tight">顧客カルテ</h1>
        <Link href="/customers/new">
          <span className="px-4 py-2 rounded-lg text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "var(--terra)", color: "white" }}>
            + 新規登録
          </span>
        </Link>
      </div>
      <CustomersList customers={rows} registered={registered === "1"} />
    </div>
  );
}
