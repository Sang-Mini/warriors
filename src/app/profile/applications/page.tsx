import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ApplicationsClient from "./ApplicationsClient";
import type { Tournament } from "@/app/HomeClient";

export default async function ApplicationsPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("tournament_applications")
    .select(`
      id,
      applied_at,
      tournaments (
        id, title, region, start_date, deadline,
        location, description, fee, fee_varies, apply_url, created_at,
        sports ( name, category, emoji )
      )
    `)
    .eq("user_id", user.id)
    .order("applied_at", { ascending: false });

  const tournaments: Tournament[] = (data ?? [])
    .map((row) => {
      const t = row.tournaments as unknown as Record<string, unknown> | null;
      if (!t) return null;
      const sportsRaw = t.sports as Record<string, unknown> | null;
      return {
        id:          t.id          as string,
        title:       t.title       as string,
        region:      t.region      as string,
        start_date:  t.start_date  as string,
        deadline:    (t.deadline   as string | null) ?? null,
        location:    (t.location   as string | null) ?? null,
        description: (t.description as string | null) ?? null,
        fee:         (t.fee        as number | null) ?? null,
        fee_varies:  (t.fee_varies as boolean | null) ?? false,
        apply_url:   (t.apply_url  as string | null) ?? null,
        created_at:  (t.created_at as string | null) ?? null,
        sports: sportsRaw ? {
          name:     sportsRaw.name     as string,
          category: sportsRaw.category as string,
          emoji:    (sportsRaw.emoji   as string | null) ?? null,
        } : null,
      } satisfies Tournament;
    })
    .filter((t): t is Tournament => t !== null);

  return <ApplicationsClient tournaments={tournaments} />;
}
