import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import AdminClient from "./AdminClient";
import type { Sport } from "@/app/onboarding/SportSelector";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || user.email !== adminEmail) redirect("/");

  // 종목 목록
  const { data: sports } = await supabase
    .from("sports")
    .select("id, name, category, emoji")
    .order("category");

  // 대회 목록 (최신순)
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select(`
      id, title, region, start_date, deadline, registration_start,
      location, fee, apply_url, is_beginner_friendly, description,
      poster_url, sport_id, tags,
      sports ( name, emoji )
    `)
    .order("created_at", { ascending: false });

  const normalizedTournaments: AdminTournament[] = (tournaments ?? []).map((row) => {
    const raw = row as Record<string, unknown>;
    const sportsRaw = Array.isArray(raw.sports)
      ? (raw.sports[0] ?? null)
      : (raw.sports ?? null);
    const s = sportsRaw as { name: string; emoji: string | null } | null;
    return {
      id:                   raw.id                   as string,
      title:                raw.title                as string,
      region:               raw.region               as string,
      start_date:           raw.start_date           as string,
      registration_start:   (raw.registration_start  as string | null) ?? null,
      deadline:             (raw.deadline            as string | null) ?? null,
      location:             (raw.location            as string | null) ?? null,
      fee:                  (raw.fee                 as number | null) ?? null,
      apply_url:            (raw.apply_url           as string | null) ?? null,
      is_beginner_friendly: (raw.is_beginner_friendly as boolean | null) ?? false,
      description:          (raw.description         as string | null) ?? null,
      poster_url:           (raw.poster_url          as string | null) ?? null,
      tags:                 (raw.tags                as string[] | null) ?? null,
      sport_id:             raw.sport_id             as string,
      sports:               s,
    };
  });

  return (
    <AdminClient
      sports={(sports ?? []) as Sport[]}
      initialTournaments={normalizedTournaments}
    />
  );
}

export type AdminTournament = {
  id: string;
  title: string;
  region: string;
  start_date: string;
  registration_start: string | null;
  deadline: string | null;
  location: string | null;
  fee: number | null;
  apply_url: string | null;
  is_beginner_friendly: boolean;
  description: string | null;
  poster_url: string | null;
  tags: string[] | null;
  sport_id: string;
  sports: { name: string; emoji: string | null } | null;
};
