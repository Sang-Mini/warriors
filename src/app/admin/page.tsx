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
      sport_id,
      sports ( name, emoji )
    `)
    .order("created_at", { ascending: false });

  return (
    <AdminClient
      sports={(sports ?? []) as Sport[]}
      initialTournaments={(tournaments ?? []) as AdminTournament[]}
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
  sport_id: string;
  sports: { name: string; emoji: string | null } | null;
};
