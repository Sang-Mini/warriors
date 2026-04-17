import { createClientSupabaseClient } from "@/lib/supabase/client";

/**
 * 현재 로그인 유저의 찜 목록 tournament_id Set 반환.
 * 비로그인이면 빈 Set 반환.
 */
export async function getWishlistedIds(): Promise<Set<string>> {
  const supabase = createClientSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data } = await supabase
    .from("wishlist")
    .select("tournament_id")
    .eq("user_id", user.id);

  return new Set((data ?? []).map((r) => r.tournament_id as string));
}

/**
 * 찜 토글.
 * - 비로그인: { ok: false, wishlisted: false, reason: "unauthenticated" }
 * - 성공:     { ok: true,  wishlisted: boolean }
 * - DB 에러:  { ok: false, wishlisted: (이전 상태), reason: string }
 */
export async function toggleWishlist(
  tournamentId: string,
  currentlyWishlisted: boolean,
): Promise<{ ok: boolean; wishlisted: boolean; reason?: string }> {
  const supabase = createClientSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { ok: false, wishlisted: false, reason: "unauthenticated" };

  if (currentlyWishlisted) {
    const { error } = await supabase
      .from("wishlist")
      .delete()
      .eq("user_id", user.id)
      .eq("tournament_id", tournamentId);

    if (error) return { ok: false, wishlisted: true, reason: error.message };
    return { ok: true, wishlisted: false };
  } else {
    const { error } = await supabase
      .from("wishlist")
      .insert({ user_id: user.id, tournament_id: tournamentId });

    if (error) return { ok: false, wishlisted: false, reason: error.message };
    return { ok: true, wishlisted: true };
  }
}
