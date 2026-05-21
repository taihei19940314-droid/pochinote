import { createAdminClient } from "@/utils/supabase/admin";

export type MatchType =
  | "exact"
  | "partial_both"
  | "partial_owner"
  | "partial_pet"
  | "partial_reversed";

export interface CustomerCandidate {
  customer: {
    id: string;
    name: string;
    phone: string | null;
  };
  pets: Array<{ id: string; name: string; breed: string | null }>;
  matchType: MatchType;
  matchedFields: string[];
  matchScore: number;
}

export async function findCustomerCandidates(
  salonId: string,
  ownerName: string | null,
  petName: string | null
): Promise<CustomerCandidate[]> {
  if (!ownerName && !petName) return [];

  const supabase = createAdminClient();

  // 紐付け済み(line_user_id が既にある)顧客は候補から除外
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, phone, pets(id, name, breed)")
    .eq("salon_id", salonId)
    .is("line_user_id", null)
    .eq("ignored", false);

  if (!customers) return [];

  const candidates: CustomerCandidate[] = [];

  for (const c of customers) {
    const pets = (c.pets ?? []) as Array<{ id: string; name: string; breed: string | null }>;
    const ownerMatch = ownerName
      ? c.name.includes(ownerName) || ownerName.includes(c.name)
      : false;
    const petMatch = petName
      ? pets.some((p) => p.name.includes(petName) || petName.includes(p.name))
      : false;
    // 順序逆パターン: ownerName がペット名と一致、petName が飼い主名と一致
    const reversedOwnerMatch = petName
      ? c.name.includes(petName) || petName.includes(c.name)
      : false;
    const reversedPetMatch = ownerName
      ? pets.some((p) => p.name.includes(ownerName) || ownerName.includes(p.name))
      : false;

    const exactOwner = ownerName ? c.name === ownerName : false;
    const exactPet = petName ? pets.some((p) => p.name === petName) : false;

    let matchType: MatchType | null = null;
    let matchScore = 0;
    const matchedFields: string[] = [];

    if (exactOwner && exactPet) {
      matchType = "exact";
      matchScore = 100;
      matchedFields.push("飼い主名(完全一致)", "ペット名(完全一致)");
    } else if (ownerMatch && petMatch) {
      matchType = "partial_both";
      matchScore = 80;
      matchedFields.push("飼い主名(部分一致)", "ペット名(部分一致)");
    } else if (ownerMatch && !petName) {
      matchType = "partial_owner";
      matchScore = 60;
      matchedFields.push("飼い主名(部分一致)");
    } else if (ownerMatch) {
      matchType = "partial_owner";
      matchScore = 60;
      matchedFields.push("飼い主名(部分一致)");
    } else if (petMatch && !ownerName) {
      matchType = "partial_pet";
      matchScore = 50;
      matchedFields.push("ペット名(部分一致)");
    } else if (petMatch) {
      matchType = "partial_pet";
      matchScore = 50;
      matchedFields.push("ペット名(部分一致)");
    } else if (reversedOwnerMatch && reversedPetMatch) {
      matchType = "partial_reversed";
      matchScore = 60; // 80 - 20 補正
      matchedFields.push("飼い主名・ペット名(順序逆の可能性)");
    }

    if (matchType) {
      candidates.push({
        customer: { id: c.id, name: c.name, phone: c.phone },
        pets,
        matchType,
        matchedFields,
        matchScore,
      });
    }
  }

  // matchScore 降順、最大10件
  return candidates
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);
}
