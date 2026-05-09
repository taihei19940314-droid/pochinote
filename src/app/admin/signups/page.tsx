import { createAdminClient } from "@/utils/supabase/admin";
import AdminGate from "./admin-gate";
import SignupsDashboard from "./signups-dashboard";

export const dynamic = "force-dynamic";

export default async function AdminSignupsPage() {
  const supabase = createAdminClient();
  const { data: signups } = await supabase
    .from("beta_signups")
    .select("id, email, created_at")
    .order("created_at", { ascending: false });

  return (
    <AdminGate>
      <SignupsDashboard signups={signups ?? []} />
    </AdminGate>
  );
}
