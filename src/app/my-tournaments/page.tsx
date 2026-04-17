import { createServerSupabaseClient } from "@/lib/supabase/server";
import MyTournamentsClient from "./MyTournamentsClient";

export default async function MyTournamentsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <MyTournamentsClient isLoggedIn={!!user} />;
}
