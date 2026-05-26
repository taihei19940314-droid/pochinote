"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";

const DEFAULT_SALON_ID = "00000000-0000-0000-0000-000000000001";

type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function approveBookingRequest(recipientId: string): Promise<ActionResult> {
  const supabase = createAdminClient();

  // 冪等性: 既に処理済みか確認
  const { data: recipient } = await supabase
    .from("offer_recipients")
    .select("id, offer_id, customer_id, status")
    .eq("id", recipientId)
    .eq("salon_id", DEFAULT_SALON_ID)
    .single();

  if (!recipient) return { ok: false, error: "予約希望が見つかりません" };
  if (recipient.status !== "booked") return { ok: false, error: "既に処理済みです" };

  const customerId = recipient.customer_id as string;

  // サロン設定(duration_min 用)
  const { data: salon } = await supabase
    .from("salons")
    .select("default_slot_minutes")
    .eq("id", DEFAULT_SALON_ID)
    .single();
  const durationMin = (salon?.default_slot_minutes as number | null) ?? 90;

  // offer の scheduled_at
  const { data: offer } = await supabase
    .from("offers")
    .select("available_from")
    .eq("id", recipient.offer_id as string)
    .single();
  if (!offer) return { ok: false, error: "空き枠情報が見つかりません" };

  // pet_id 引き継ぎ: 直近 completed booking → fallback: 最古の pet
  const { data: lastBooking } = await supabase
    .from("bookings")
    .select("pet_id")
    .eq("customer_id", customerId)
    .eq("salon_id", DEFAULT_SALON_ID)
    .eq("status", "completed")
    .order("scheduled_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let petId = lastBooking?.pet_id as string | null | undefined;

  if (!petId) {
    const { data: firstPet } = await supabase
      .from("pets")
      .select("id")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    petId = firstPet?.id ?? null;
  }

  if (!petId) return { ok: false, error: "ペットが登録されていないため承認できません" };

  // bookings INSERT
  const { data: booking, error: bookingErr } = await supabase
    .from("bookings")
    .insert({
      salon_id: DEFAULT_SALON_ID,
      customer_id: customerId,
      pet_id: petId,
      scheduled_at: offer.available_from as string,
      duration_min: durationMin,
      services: [],
      status: "confirmed",
      price: null,
      memo: "LINE オファー経由",
    })
    .select("id")
    .single();

  if (bookingErr || !booking) {
    return { ok: false, error: "予約の作成に失敗しました" };
  }

  // offer_recipients UPDATE
  const { error: recipErr } = await supabase
    .from("offer_recipients")
    .update({ status: "approved" })
    .eq("id", recipientId);

  if (recipErr) {
    // 補償: booking を削除
    await supabase.from("bookings").delete().eq("id", booking.id);
    return { ok: false, error: "ステータス更新に失敗しました" };
  }

  revalidatePath("/line/offers/pending");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function declineBookingRequest(recipientId: string): Promise<ActionResult> {
  const supabase = createAdminClient();

  const { data: recipient } = await supabase
    .from("offer_recipients")
    .select("id, status")
    .eq("id", recipientId)
    .eq("salon_id", DEFAULT_SALON_ID)
    .single();

  if (!recipient) return { ok: false, error: "予約希望が見つかりません" };
  if (recipient.status !== "booked") return { ok: false, error: "既に処理済みです" };

  const { error } = await supabase
    .from("offer_recipients")
    .update({ status: "declined_by_salon" })
    .eq("id", recipientId);

  if (error) return { ok: false, error: "却下処理に失敗しました" };

  revalidatePath("/line/offers/pending");
  revalidatePath("/dashboard");
  return { ok: true };
}
