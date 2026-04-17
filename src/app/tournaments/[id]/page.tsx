import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import TournamentDetailClient, { type TournamentDetail } from "./TournamentDetailClient";

// 확장 컬럼 (DB 마이그레이션 전에는 null로 처리)
const EXTENDED_COLS = `
  poster_url,
  organizer,
  start_time,
  registration_start,
`;

const BASE_SELECT = `
  id,
  title,
  region,
  start_date,
  deadline,
  location,
  description,
  fee,
  apply_url,
  created_at,
  is_beginner_friendly,
  sports!sport_id ( name, category, emoji )
`;

const FULL_SELECT = `
  id,
  title,
  region,
  start_date,
  deadline,
  location,
  description,
  fee,
  apply_url,
  created_at,
  ${EXTENDED_COLS}
  is_beginner_friendly,
  sports!sport_id ( name, category, emoji )
`;

function buildTournament(raw: Record<string, unknown>): TournamentDetail {
  const sports = Array.isArray(raw.sports)
    ? (raw.sports[0] ?? null)
    : (raw.sports ?? null);

  return {
    id:                   raw.id                   as string,
    title:                raw.title                as string,
    region:               raw.region               as string,
    start_date:           raw.start_date           as string,
    start_time:           (raw.start_time          as string  | null) ?? null,
    deadline:             (raw.deadline            as string  | null) ?? null,
    location:             (raw.location            as string  | null) ?? null,
    description:          (raw.description         as string  | null) ?? null,
    fee:                  (raw.fee                 as number  | null) ?? null,
    apply_url:            (raw.apply_url           as string  | null) ?? null,
    poster_url:           (raw.poster_url           as string  | null) ?? null,
    organizer:            (raw.organizer            as string  | null) ?? null,
    created_at:           (raw.created_at           as string  | null) ?? null,
    registration_start:   (raw.registration_start   as string  | null) ?? null,
    is_beginner_friendly: (raw.is_beginner_friendly as boolean | null) ?? false,
    sports:               sports as TournamentDetail["sports"],
  };
}

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  // 1차: 모든 컬럼으로 시도
  const { data, error } = await supabase
    .from("tournaments")
    .select(FULL_SELECT)
    .eq("id", id)
    .single();

  if (!error && data) {
    return <TournamentDetailClient t={buildTournament(data as Record<string, unknown>)} />;
  }

  // 컬럼 에러(42703) 또는 schema 에러면 기본 컬럼으로 재시도
  const isColumnError =
    error?.code === "42703" ||
    error?.message?.toLowerCase().includes("column") ||
    error?.message?.toLowerCase().includes("does not exist");

  if (isColumnError) {
    console.warn(`[tournament/${id}] 확장 컬럼 없음, 기본 쿼리로 재시도:`, error.message);

    const fallback = await supabase
      .from("tournaments")
      .select(BASE_SELECT)
      .eq("id", id)
      .single();

    if (fallback.error || !fallback.data) {
      console.error(`[tournament/${id}] fallback 에러:`, fallback.error?.message);
      notFound();
    }

    return (
      <TournamentDetailClient
        t={buildTournament(fallback.data as Record<string, unknown>)}
      />
    );
  }

  // 그 외(행 없음, 네트워크 등)
  console.error(`[tournament/${id}] 에러:`, error?.message);
  notFound();
}
