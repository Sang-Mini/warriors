import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("nickname, marketing_agreed, avatar_url, provider, created_at")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <ProfileClient
      userId={user.id}
      email={user.email ?? null}
      authCreatedAt={user.created_at}
      nickname={profile?.nickname ?? null}
      marketingAgreed={profile?.marketing_agreed ?? false}
      avatarUrl={profile?.avatar_url ?? null}
      provider={profile?.provider ?? "google"}
    />
  );
}
