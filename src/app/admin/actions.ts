"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function createAdminClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try { list.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* server component context */ }
        },
      },
    }
  );
}

export type TournamentInput = {
  title: string;
  sport_id: string;
  start_date: string;
  registration_start: string | null;
  deadline: string | null;
  region: string;
  location: string | null;
  fee: number | null;
  apply_url: string | null;
  is_beginner_friendly: boolean;
  description: string | null;
  poster_url: string | null;
};

export async function uploadPoster(formData: FormData): Promise<string> {
  const supabase = await createAdminClient();
  const file = formData.get("file") as File;
  if (!file) throw new Error("파일이 없습니다.");

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("tournament-posters")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("tournament-posters").getPublicUrl(path);
  return data.publicUrl;
}

export async function createTournament(input: TournamentInput) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from("tournaments").insert([input]);
  if (error) throw new Error(error.message);
}

export async function updateTournament(id: string, input: TournamentInput) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from("tournaments").update(input).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTournament(id: string) {
  const supabase = await createAdminClient();
  const { error } = await supabase.from("tournaments").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
