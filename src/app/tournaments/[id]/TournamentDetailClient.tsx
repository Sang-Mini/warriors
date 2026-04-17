"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toggleWishlist } from "@/lib/wishlist";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import Toast from "@/components/Toast";

// ── 디자인 토큰 ───────────────────────────────────────────────────────────────
const C = {
  primary:   "#1B1464",
  secondary: "#6C3CE1",
  surface:   "#ffffff",
  text:      "#000000",
  sub:       "#6E6E73",
} as const;

const EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

// ── 타입 ──────────────────────────────────────────────────────────────────────
export type TournamentDetail = {
  id: string;
  title: string;
  region: string;
  start_date: string;
  start_time: string | null;
  deadline: string | null;
  location: string | null;
  description: string | null;
  fee: number | null;
  apply_url: string | null;
  poster_url: string | null;
  organizer: string | null;
  created_at: string | null;
  registration_start: string | null;
  is_beginner_friendly: boolean;
  sports: { name: string; category: string; emoji: string | null } | null;
};

// ── 상수 ──────────────────────────────────────────────────────────────────────
const CAT_STYLE: Record<string, { bg: string; fg: string }> = {
  격투기:    { bg: "#EDE8FF", fg: C.primary   },
  두뇌스포츠: { bg: "#EDE0FF", fg: C.secondary },
  "e스포츠": { bg: "#DFF5FF", fg: "#0369A1"   },
  학습:      { bg: "#E0FFF0", fg: "#065F46"   },
};
const CAT_DEFAULT = { bg: "#F2F2F7", fg: C.sub };

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────
function getDday(s: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const t     = new Date(s);  t.setHours(0, 0, 0, 0);
  return Math.ceil((t.getTime() - today.getTime()) / 86_400_000);
}

function fmtDate(s: string, time?: string | null) {
  const d = new Date(s);
  const W = ["일","월","화","수","목","금","토"];
  const p = (n: number) => String(n).padStart(2, "0");
  const base = `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())} (${W[d.getDay()]})`;
  return time ? `${base} ${time}` : base;
}

// ── 헤더 ─────────────────────────────────────────────────────────────────────
function Header() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50" style={{
      background: "rgba(255,255,255,0.88)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderBottom: "0.5px solid rgba(108,60,225,0.1)",
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto", padding: "0 24px",
        height: 56, display: "flex", alignItems: "center",
      }}>
        <button onClick={() => router.back()} aria-label="뒤로 가기"
          style={{ display: "flex", alignItems: "center", gap: 5,
            fontSize: 14, fontWeight: 500, color: C.sub,
            background: "none", border: "none", cursor: "pointer",
            transition: `color 150ms ${EASE}` }}
          onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = C.sub; }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <path d="M12.5 4L7 10L12.5 16" stroke="currentColor"
              strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          목록으로
        </button>
      </div>
    </header>
  );
}

// ── D-day 미니 카드 (우측 패널용) ────────────────────────────────────────────
function MiniDday({ dday, label, total }: { dday: number; label: string; total?: number }) {
  const urgent  = dday >= 0 && dday <= 7;
  const isToday = dday === 0;
  const isPast  = dday < 0;
  const text    = isToday ? "D-DAY" : isPast ? `D+${Math.abs(dday)}` : `D-${dday}`;

  const showProgress = total != null && total > 0 && !isPast;
  // 남은 비율 (오른쪽→왼쪽으로 줄어드는 방향: 남은 기간만큼 왼쪽부터 채움)
  const remaining = showProgress
    ? Math.max(0, Math.min(100, (dday / total) * 100))
    : 0;

  return (
    <div style={{ flex: 1, borderRadius: 12,
      background: urgent ? "#fff0f0" : "#f0edff",
      border: `1.5px solid ${urgent ? "#FFCDD2" : "rgba(108,60,225,0.3)"}` }}>
      <div style={{ padding: "12px 14px" }}>
        <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4,
          color: urgent ? "#E24B4A" : C.primary }}>
          {label}
        </p>
        <div style={{ display: "flex", alignItems: "flex-end",
          justifyContent: "space-between", gap: 4 }}>
          <p className="font-suit font-extrabold"
            style={{ fontSize: 26, lineHeight: 1,
              letterSpacing: "-0.01em", fontVariantNumeric: "tabular-nums",
              color: urgent ? "#E24B4A" : C.primary }}>
            {text}
          </p>
          {urgent && (
            <span style={{ fontSize: 10, fontWeight: 600, paddingBottom: 1,
              color: "#E24B4A" }}>
              {isToday ? "오늘!" : `${dday}일`}
            </span>
          )}
        </div>
        {showProgress && (
          <div style={{ marginTop: 12, height: 4, borderRadius: 2,
            background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 2,
              background: remaining < 10 ? "#EF4444" : remaining < 30 ? "#FACC15" : "#4ADE80",
              width: `${remaining}%` }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── 정보 리스트 행 ────────────────────────────────────────────────────────────
function InfoRow({ icon, label, children, action }: {
  icon: React.ReactNode; label: string;
  children: React.ReactNode; action?: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12,
      padding: "11px 0", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(108,60,225,0.1)",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, display: "flex", justifyContent: "space-between",
        alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: 11, color: "#4B5563", flexShrink: 0, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: C.text,
          fontVariantNumeric: "tabular-nums", textAlign: "right" }}>
          {children}
        </span>
      </div>
      {action}
    </div>
  );
}

// ── 구분선 ────────────────────────────────────────────────────────────────────
function Divider() {
  return <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "16px 0" }} />;
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function TournamentDetailClient({ t }: { t: TournamentDetail }) {
  const router = useRouter();
  const [liked,        setLiked]        = useState(false);
  const [wishLoading,  setWishLoading]  = useState(false);
  const [isLoggedIn,   setIsLoggedIn]   = useState(false);
  const [toastShow,     setToastShow]    = useState(false);
  const [toastMsg,      setToastMsg]    = useState("");
  const [toastDuration, setToastDuration] = useState(1800);

  const dday         = getDday(t.start_date);
  const deadlineDday = t.deadline ? getDday(t.deadline) : null;
  const canApply     = !!t.apply_url;

  // progress bar용 total: 고정 90일 또는 실제 남은 일수 중 큰 값
  const startTotal   = (dday !== null && dday >= 0)         ? Math.max(dday, 90)         : undefined;
  const deadlineTotal = (deadlineDday !== null && deadlineDday >= 0) ? Math.max(deadlineDday, 90) : undefined;
  const cat          = CAT_STYLE[t.sports?.category ?? ""] ?? CAT_DEFAULT;

  // 로그인 여부 + 찜 상태 초기화 + 로그아웃 감지
  useEffect(() => {
    const supabase = createClientSupabaseClient();

    // 초기 세션 확인
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setIsLoggedIn(true);
      supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", user.id)
        .eq("tournament_id", t.id)
        .maybeSingle()
        .then(({ data }) => { if (data) setLiked(true); });
    });

    // 인증 상태 변화 구독 (로그아웃 시 찜 상태 초기화)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setIsLoggedIn(false);
        setLiked(false);
      } else if (event === "SIGNED_IN") {
        setIsLoggedIn(true);
      }
    });

    return () => { subscription.unsubscribe(); };
  }, [t.id]);

  const showToast = (msg: string, duration = 1800) => {
    setToastMsg(msg);
    setToastDuration(duration);
    setToastShow(true);
  };

  const handleWishlist = async () => {
    if (!isLoggedIn) {
      showToast("찜하려면 로그인이 필요해요", 1200);
      setTimeout(() => router.push("/login"), 1200);
      return;
    }
    if (wishLoading) return;
    setWishLoading(true);
    const result = await toggleWishlist(t.id, liked);
    setWishLoading(false);
    if (result.ok) {
      setLiked(result.wishlisted);
      showToast(result.wishlisted ? "찜 목록에 추가됐어요 ❤️" : "찜 목록에서 제거됐어요");
    }
  };

  const copyLocation = async () => {
    if (!t.location) return;
    try {
      await navigator.clipboard.writeText(t.location);
    } catch {
      const el = document.createElement("textarea");
      el.value = t.location;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    showToast("✓ 복사됨!");
  };


  return (
    <div style={{ display: "flex", flexDirection: "column", background: C.surface }}>
      <Header />
      <Toast visible={toastShow} message={toastMsg} duration={toastDuration} onClose={() => setToastShow(false)} position="bottom" />

      {/* 하단 고정 CTA */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#ffffff", zIndex: 40,
        boxShadow: "0 -4px 20px rgba(108,60,225,0.10)",
      }}>
        <div style={{
          maxWidth: 1100, margin: "0 auto", padding: "12px 24px",
          display: "flex", gap: 10, boxSizing: "border-box", width: "100%",
        }}>
          {/* 찜하기 */}
          <button onClick={handleWishlist}
            aria-label={liked ? "찜 해제" : "찜하기"}
            disabled={wishLoading}
            style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0,
              border: `1px solid ${liked ? "#E24B4A" : "#e5e7eb"}`,
              background: liked ? "#FFF0F0" : "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: wishLoading ? "not-allowed" : "pointer",
              opacity: wishLoading ? 0.6 : 1,
              transition: `all 200ms ${EASE}` }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.90)"; }}
            onMouseUp={(e)   => { e.currentTarget.style.transform = "scale(1)"; }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 19C11 19 2 13.5 2 7.5C2 5.01 4.01 3 6.5 3C8.24 3 9.76 3.97 10.65 5.44L11 6L11.35 5.44C12.24 3.97 13.76 3 15.5 3C17.99 3 20 5.01 20 7.5C20 13.5 11 19 11 19Z"
                fill={liked ? "#E24B4A" : "none"}
                stroke={liked ? "#E24B4A" : "#AEAEB2"}
                strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </button>

          {/* 신청하러 가기 */}
          <button
            onClick={() => canApply && t.apply_url &&
              window.open(t.apply_url, "_blank", "noopener,noreferrer")}
            disabled={!canApply}
            className="font-suit font-bold"
            style={{ flex: 1, height: 52, borderRadius: 12,
              border: "none", cursor: canApply ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              fontSize: 15,
              ...(canApply ? {
                background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
                color: "#fff",
                boxShadow: "0 4px 16px rgba(27,20,100,0.25)",
                transition: `filter 150ms ${EASE}, transform 150ms ${EASE}`,
              } : { background: "#F2F2F7", color: "#AEAEB2" }) }}
            onMouseEnter={(e) => { if (canApply) e.currentTarget.style.filter = "brightness(1.08)"; }}
            onMouseLeave={(e) => { if (canApply) e.currentTarget.style.filter = "brightness(1)"; }}
            onMouseDown={(e) => { if (canApply) e.currentTarget.style.transform = "scale(0.97)"; }}
            onMouseUp={(e)   => { if (canApply) e.currentTarget.style.transform = "scale(1)"; }}>
            {canApply ? (
              <>
                신청하러 가기
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <path d="M3.5 9H14.5M10 4.5L14.5 9L10 13.5"
                    stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            ) : "신청 링크가 없어요"}
          </button>
        </div>
      </div>

      {/* 반응형 오버라이드 (media query만 — 레이아웃은 인라인 스타일) */}
      <style>{`
        .poster-area {
          position: relative;
          height: 100%;
          min-height: 480px;
          border-radius: 20px;
          overflow: hidden;
        }
        .panel-buttons { display: none !important; }
        @media (max-width: 768px) {
          .content-wrap  { padding: 20px 16px 100px !important; }
          .content-grid  { grid-template-columns: 1fr !important; gap: 20px !important; }
          .poster-area   { min-height: 240px !important; }
        }
      `}</style>

      {/* ── 메인 콘텐츠 wrapper ── */}
      <div className="content-wrap" style={{
        width: "100%", maxWidth: 1100, margin: "0 auto",
        padding: "32px 24px 100px", boxSizing: "border-box",
      }}>

        {/* 1. 2컬럼 그리드 */}
        <div className="content-grid" style={{
          display: "grid", gridTemplateColumns: "9fr 11fr",
          gap: 32, alignItems: "stretch", boxSizing: "border-box",
        }}>

          {/* 좌측: 포스터 */}
          <div className="poster-area"
            style={{
              background: t.poster_url
                ? undefined
                : `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
            }}
          >
            {t.poster_url ? (
              <Image src={t.poster_url} alt={`${t.title} 포스터`} fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 768px) 100vw, (max-width: 1100px) 45vw, 495px" />
            ) : (
              <PosterPlaceholder t={t} />
            )}
          </div>

          {/* 우측: sticky 정보 패널 */}
          <div style={{ position: "sticky", top: 88, boxSizing: "border-box" }}>
            <div style={{
              background: "#fff", borderRadius: 20, padding: "24px",
              border: "1px solid rgba(108,60,225,0.15)",
              boxShadow: "0 4px 24px rgba(108,60,225,0.15)",
            }}>

              {/* 배지들 */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {t.sports && (
                  <span className="font-suit font-bold"
                    style={{ display: "inline-flex", alignItems: "center", gap: 4,
                      fontSize: 11, padding: "3px 10px",
                      borderRadius: 100, background: cat.bg, color: cat.fg }}>
                    {t.sports.emoji && <span style={{ fontSize: 13 }}>{t.sports.emoji}</span>}
                    {t.sports.name}
                  </span>
                )}
                {t.is_beginner_friendly && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 11, fontWeight: 700, padding: "3px 10px",
                    borderRadius: 100, background: "#E0FFF0", color: "#065F46" }}>
                    🌱 초보자 환영
                  </span>
                )}
              </div>

              {/* 대회명 */}
              <h1 className="font-suit font-extrabold"
                style={{ fontSize: 24, lineHeight: 1.3,
                letterSpacing: "-0.02em", color: C.text,
                marginBottom: t.organizer ? 6 : 0 }}>
                {t.title}
              </h1>
              {t.organizer && (
                <p style={{ fontSize: 13, color: C.sub, marginBottom: 0 }}>
                  주최 · {t.organizer}
                </p>
              )}

              <Divider />

              {/* D-day 2개 가로 */}
              <div style={{ display: "flex", gap: 8 }}>
                <MiniDday dday={dday} label="대회 시작까지" total={startTotal} />
                {deadlineDday !== null ? (
                  <MiniDday dday={deadlineDday} label="접수 마감까지"
                    total={deadlineTotal} />
                ) : (
                  <div style={{ flex: 1, borderRadius: 12, padding: "12px 14px",
                    background: "#ffffff", border: "1.5px solid rgba(108,60,225,0.3)",
                    display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: C.sub }}>마감 미정</span>
                  </div>
                )}
              </div>

              <Divider />

              {/* 핵심 정보 리스트 */}
              <div>
                <InfoRow icon={<CalIcon />} label="대회 날짜">
                  {fmtDate(t.start_date, t.start_time)}
                </InfoRow>
                <InfoRow icon={<PinIcon />} label="대회 장소"
                  action={t.location && (
                    <button onClick={copyLocation} title="주소 복사"
                      aria-label="주소 복사"
                      style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 7,
                        background: "rgba(108,60,225,0.08)",
                        border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: `background 150ms ${EASE}` }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(108,60,225,0.16)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(108,60,225,0.08)"; }}
                      onMouseDown={(e)  => { e.currentTarget.style.transform = "scale(0.88)"; }}
                      onMouseUp={(e)    => { e.currentTarget.style.transform = "scale(1)"; }}>
                      <CopyIcon />
                    </button>
                  )}>
                  {[t.region, t.location].filter(Boolean).join(" · ")}
                </InfoRow>
                <InfoRow icon={<ClockIcon />} label="접수 기간">
                  {(() => {
                    const regStart = t.registration_start ?? t.created_at;
                    const regEnd   = t.deadline;
                    if (regStart && regEnd) return `${fmtDate(regStart)} ~ ${fmtDate(regEnd)}`;
                    if (regEnd)            return `~ ${fmtDate(regEnd)}`;
                    return "미정";
                  })()}
                </InfoRow>
                <InfoRow icon={<WonIcon />} label="참가비">
                  {t.fee == null ? "미정" : t.fee === 0 ? "무료" : `${t.fee.toLocaleString()}원`}
                </InfoRow>
              </div>

              {/* panel-buttons: 항상 숨김 (CSS로 제어) */}
              <div className="panel-buttons" style={{ display: "flex", gap: 10, marginTop: 20 }} />

            </div>
          </div>
        </div>

        {/* 2. 대회 소개 */}
        {t.description && (
          <div style={{ marginTop: 24, width: "100%", boxSizing: "border-box" }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: C.sub,
              letterSpacing: "0.05em", marginBottom: 10, paddingLeft: 2 }}>
              대회 소개
            </p>
            <div style={{
              borderRadius: 16, padding: "20px 22px",
              background: "#fff",
              border: "1px solid rgba(108,60,225,0.15)",
              boxShadow: "0 2px 12px rgba(108,60,225,0.12)",
              fontSize: 14, lineHeight: 1.8,
              color: C.text, whiteSpace: "pre-wrap",
              width: "100%", boxSizing: "border-box",
            }}>
              {t.description}
            </div>
          </div>
        )}

      </div>{/* content-wrap */}
    </div>
  );
}

// ── 포스터 플레이스홀더 ───────────────────────────────────────────────────────
function PosterPlaceholder({ t }: { t: TournamentDetail }) {
  const cat = CAT_STYLE[t.sports?.category ?? ""] ?? CAT_DEFAULT;
  return (
    <div style={{ position: "absolute", inset: 0,
      background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 12, padding: "24px" }}>
      <div style={{ position: "absolute", top: -30, right: -30,
        width: 160, height: 160, borderRadius: "50%",
        background: "rgba(255,255,255,0.07)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -20, left: -20,
        width: 110, height: 110, borderRadius: "50%",
        background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />
      {t.sports?.emoji && (
        <span style={{ fontSize: 48, lineHeight: 1, zIndex: 1 }}>{t.sports.emoji}</span>
      )}
      <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px",
        borderRadius: 100, background: "rgba(255,255,255,0.18)",
        color: "#fff", zIndex: 1 }}>
        {t.sports?.name ?? "스포츠"}
      </span>
      <p style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)",
        textAlign: "center", lineHeight: 1.4, zIndex: 1, marginTop: 4 }}>
        {t.title}
      </p>
    </div>
  );
}

// ── 아이콘 ────────────────────────────────────────────────────────────────────
function CalIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 17 17" fill="none" aria-hidden>
      <rect x="1" y="2.5" width="15" height="13" rx="3" stroke={C.secondary} strokeWidth="1.4" />
      <path d="M5.5 1V4M11.5 1V4M1 7H16"
        stroke={C.secondary} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="12" height="15" viewBox="0 0 14 17" fill="none" aria-hidden>
      <path d="M7 1C4.24 1 2 3.24 2 6C2 9.5 7 16 7 16C7 16 12 9.5 12 6C12 3.24 9.76 1 7 1Z"
        stroke={C.secondary} strokeWidth="1.4" />
      <circle cx="7" cy="6" r="2" stroke={C.secondary} strokeWidth="1.3" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 17 17" fill="none" aria-hidden>
      <circle cx="8.5" cy="8.5" r="7.5" stroke={C.secondary} strokeWidth="1.4" />
      <path d="M8.5 5V9L11 10.5"
        stroke={C.secondary} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function WonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 17 17" fill="none" aria-hidden>
      <circle cx="8.5" cy="8.5" r="7.5" stroke={C.secondary} strokeWidth="1.4" />
      <path d="M5.5 5.5L7.5 11.5M11.5 5.5L9.5 11.5M5.5 8H11.5M5.5 10H11.5"
        stroke={C.secondary} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
      <rect x="4.5" y="4.5" width="8" height="8" rx="1.5" stroke={C.secondary} strokeWidth="1.3" />
      <path d="M2.5 9.5H2C1.45 9.5 1 9.05 1 8.5V2C1 1.45 1.45 1 2 1H8.5C9.05 1 9.5 1.45 9.5 2V2.5"
        stroke={C.secondary} strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
