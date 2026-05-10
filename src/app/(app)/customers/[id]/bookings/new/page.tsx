import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import NewBookingForm from "./new-booking-form";

// TODO: 認証実装後、ログイン中のサロンIDに置き換える
const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";

export const dynamic = "force-dynamic";

export default async function NewBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: customer }, { data: pets }, { data: staff }] = await Promise.all([
    supabase.from("customers").select("id, name").eq("id", id).eq("salon_id", DEFAULT_SALON_ID).single(),
    supabase.from("pets").select("id, name, breed").eq("customer_id", id),
    supabase.from("staff").select("id, name").eq("salon_id", DEFAULT_SALON_ID),
  ]);

  if (!customer) notFound();

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link href={`/customers/${id}`} className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: "var(--ink-soft)" }}>
        ← 顧客詳細に戻る
      </Link>
      <h1 className="font-display text-2xl font-light tracking-tight mb-1">来店記録を追加</h1>
      <p className="text-sm mb-8" style={{ color: "var(--ink-soft)" }}>{customer.name}さんの来店記録を追加します</p>

      <NewBookingForm
        customerId={id}
        salonId={DEFAULT_SALON_ID}
        pets={pets ?? []}
        staff={staff ?? []}
      />
    </div>
  );
}
