import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import WishlistClient from "./WishlistClient";
import type { Tournament } from "@/app/HomeClient";

export default async function WishlistPage() {
  const supabase = await createServerSupabaseClient();

  // 인증 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 찜 목록 + 대회 정보 조회
  const { data, error } = await supabase
    .from("wishlist")
    .select(`
      id,
      created_at,
      tournaments (
        id, title, region, start_date, deadline,
        location, description, fee, apply_url,
        sports ( name, category, emoji )
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Supabase nested join 결과를 Tournament[] 타입으로 정규화
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
        apply_url:   (t.apply_url  as string | null) ?? null,
        sports: sportsRaw
          ? {
              name:     sportsRaw.name     as string,
              category: sportsRaw.category as string,
              emoji:    (sportsRaw.emoji   as string | null) ?? null,
            }
          : null,
      } satisfies Tournament;
    })
    .filter((t): t is Tournament => t !== null);

  return (
    <WishlistClient
      tournaments={tournaments}
      errorMessage={error?.message ?? null}
    />
  );
}
