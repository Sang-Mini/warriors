import { Suspense } from "react";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import HomeClient, { type Tournament, type Sport } from "./HomeClient";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  const today = new Date().toISOString().split("T")[0];

  const { data: sportsData } = await supabase
    .from("sports")
    .select("name, category, emoji")
    .order("category");

  const sports: Sport[] = (sportsData ?? []).map((s) => ({
    name:     s.name     as string,
    category: s.category as string,
    emoji:    (s.emoji   as string | null) ?? null,
  }));

  /*
   * tournaments 실제 컬럼:
   *   id, title, sport_id (→ sports.id), region, start_date,
   *   location, description, fee, created_at
   *
   * sports 실제 컬럼:
   *   id, name, category, emoji, created_at
   *
   * RLS 안내:
   *   tournaments 테이블에 SELECT 공개 정책이 없으면 빈 배열이 반환됩니다.
   *   Supabase Dashboard → Authentication → Policies 에서
   *   "Enable read access for all users" 정책을 추가하세요.
   */
  const { data, error } = await supabase
    .from("tournaments")
    .select(
      `
      id,
      title,
      region,
      start_date,
      deadline,
      location,
      description,
      fee,
      apply_url,
      sports!sport_id ( name, category, emoji )
    `
    )
    .eq("is_visible", true)
    .gte("start_date", today)
    .order("start_date", { ascending: true });

  console.log(
    "[home] tournaments rows:",
    data?.length ?? 0,
    "| error:",
    error?.message ?? "없음"
  );

  if (error) {
    console.error("[home] Supabase 에러 상세:", JSON.stringify(error));
  }

  // sports 필드 정규화 (Supabase가 배열로 반환할 경우 첫 번째 요소 사용)
  const tournaments: Tournament[] = (data ?? []).map((row) => {
    const raw = row as Record<string, unknown>;
    const sports = Array.isArray(raw.sports)
      ? (raw.sports[0] ?? null)
      : (raw.sports ?? null);
    return {
      id: raw.id as string,
      title: raw.title as string,
      region: raw.region as string,
      start_date: raw.start_date as string,
      deadline: (raw.deadline as string | null) ?? null,
      location: (raw.location as string | null) ?? null,
      description: (raw.description as string | null) ?? null,
      fee: (raw.fee as number | null) ?? null,
      apply_url: (raw.apply_url as string | null) ?? null,
      sports: sports as Tournament["sports"],
    };
  });

  return (
    <Suspense fallback={null}>
      <HomeClient tournaments={tournaments} sports={sports} errorMessage={error?.message ?? null} />
    </Suspense>
  );
}
