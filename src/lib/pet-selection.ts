import type { SupabaseClient } from "@supabase/supabase-js";

export function selectPetIdFromCandidates(
  lastBookingPetId: string | null,
  firstPetId: string | null,
): string | null {
  return lastBookingPetId ?? firstPetId ?? null;
}

export async function selectPetForOffer(
  customerId: string,
  salonId: string,
  supabase: SupabaseClient,
): Promise<string | null> {
  const { data: lastBooking } = await supabase
    .from("bookings")
    .select("pet_id")
    .eq("customer_id", customerId)
    .eq("salon_id", salonId)
    .eq("status", "completed")
    .order("scheduled_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: firstPet } = await supabase
    .from("pets")
    .select("id")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return selectPetIdFromCandidates(
    (lastBooking?.pet_id as string | null) ?? null,
    firstPet?.id ?? null,
  );
}
