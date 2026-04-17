import { createServerSupabaseClient } from "@/lib/supabase/server";
import SportSelector, { type Sport } from "./SportSelector";

export default async function OnboardingPage() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("sports")
    .select("id, name, category, emoji")
    .order("id");

  console.log("[onboarding] sports 조회 결과 — rows:", data?.length ?? 0, "error:", error?.message ?? "없음");

  if (error) {
    console.error("[onboarding] Supabase 에러 상세:", JSON.stringify(error));
  }

  const sports: Sport[] = data ?? [];

  return <SportSelector sports={sports} errorMessage={error?.message ?? null} />;
}
