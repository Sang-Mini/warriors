"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { getWishlistedIds, toggleWishlist } from "@/lib/wishlist";
import Toast from "@/components/Toast";
import type { User } from "@supabase/supabase-js";

// ── 디자인 토큰 ───────────────────────────────────────────────────────────────
const C = {
  primary:   "#1B1464",
  secondary: "#6C3CE1",
  accent:    "#00D4FF",
  surface:   "#f8f7ff",
  gray:      "#F2F2F7",
  text:      "#000000",
  sub:       "#6E6E73",
} as const;

const EASE    = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";
const PAGE_SZ = 12;

// ── 타입 ──────────────────────────────────────────────────────────────────────
export type Sport = {
  name: string;
  category: string;
  emoji: string | null;
};

export type Tournament = {
  id: string;
  title: string;
  region: string;
  start_date: string;
  deadline: string | null;
  location: string | null;
  description: string | null;
  fee: number | null;
  apply_url: string | null;
  sports: Sport | null;
};

// ── 상수 ──────────────────────────────────────────────────────────────────────
const SPORT_FILTERS  = ["격투기", "두뇌스포츠", "e스포츠", "학습", "구기종목", "수영", "육상", "사이클", "양궁", "골프", "테니스", "배드민턴", "탁구", "볼링", "당구", "댄스스포츠"];
const REGION_FILTERS = ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
const DATE_FILTERS: { label: string; days: number }[] = [
  { label: "이번 주", days: 7 },
  { label: "2주 이내", days: 14 },
  { label: "이번 달", days: 30 },
  { label: "3개월",   days: 90 },
  { label: "6개월",   days: 180 },
];

const CAT_STYLE: Record<string, { bg: string; fg: string }> = {
  격투기:    { bg: "#EDE8FF", fg: C.primary   },
  두뇌스포츠: { bg: "#EDE0FF", fg: C.secondary },
  "e스포츠": { bg: "#DFF5FF", fg: "#0369A1"   },
  학습:      { bg: "#E0FFF0", fg: "#065F46"   },
};
const CAT_DEFAULT = { bg: C.gray, fg: C.sub };

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────
function getDday(s: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const t     = new Date(s);  t.setHours(0, 0, 0, 0);
  return Math.ceil((t.getTime() - today.getTime()) / 86_400_000);
}

function fmtDate(s: string) {
  const d = new Date(s);
  const W = ["일","월","화","수","목","금","토"];
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())} (${W[d.getDay()]})`;
}

// ── W 로고 ────────────────────────────────────────────────────────────────────
function Logo({ size = "md", id = "g0" }: { size?: "sm"|"md"; id?: string }) {
  const [sw, sh] = size === "sm" ? [26, 20] : [34, 27];
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg width={sw} height={sh} viewBox="0 0 38 30" fill="none" aria-hidden>
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={C.primary}   />
            <stop offset="100%" stopColor={C.secondary} />
          </linearGradient>
        </defs>
        <path d="M2 4 L10 26 L19 11 L28 26 L36 4"
          stroke={`url(#${id})`} strokeWidth="4.5"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex items-center gap-1.5">
        <span style={{ fontSize: size === "sm" ? 15 : 20, fontWeight: 400,
          letterSpacing: "0.18em", color: C.text,
          fontFamily: "var(--font-bebas)" }}>
          WARRIORS
        </span>
        <svg width="8" height="8" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path d="M5 0 L6.1 3.4 L9.8 3.4 L6.9 5.5 L8 8.9 L5 6.8 L2 8.9 L3.1 5.5 L0.2 3.4 L3.9 3.4 Z"
            fill={C.accent} />
        </svg>
      </div>
    </div>
  );
}

// ── 헤더 (스크롤 backdrop-blur) ───────────────────────────────────────────────
function Header({ onAfterLogout }: { onAfterLogout?: () => void }) {
  const [scrolled, setScrolled]           = useState(false);
  const [user, setUser]                   = useState<User | null>(null);
  const [avatarUrl, setAvatarUrl]         = useState<string | null>(null);
  const [nickname, setNickname]           = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const dropdownRef                       = useRef<HTMLDivElement>(null);

  // 스크롤 감지
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  // 로그인 세션 확인
  useEffect(() => {
    const supabase = createClientSupabaseClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) return;
      setUser(u);
      setAvatarUrl((u.user_metadata?.avatar_url as string | undefined) ?? null);

      // users 테이블에서 닉네임 조회
      supabase
        .from("users")
        .select("nickname")
        .eq("id", u.id)
        .single()
        .then(({ data }) => {
          if (data?.nickname) setNickname(data.nickname as string);
        });
    });
  }, []);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [dropdownOpen]);

  async function handleLogout() {
    const supabase = createClientSupabaseClient();
    await supabase.auth.signOut();
    setUser(null);
    setAvatarUrl(null);
    setNickname(null);
    setDropdownOpen(false);
    onAfterLogout?.();
  }

  return (
    <header className="sticky top-0 z-50" style={{
      height: 64,
      background:           scrolled ? "rgba(255,255,255,0.82)" : "#ffffff",
      backdropFilter:       scrolled ? "blur(20px)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
      borderBottom:         "0.5px solid rgba(108,60,225,0.10)",
      transition:           `background 300ms ${EASE}`,
    }}>
      <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between md:grid md:items-center" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
        <Logo id="gHdr" />
        <nav className="hidden md:flex items-center gap-7">
          {([{ label: "대회 찾기", href: "/" }, { label: "내 대회", href: "/my-tournaments" }] as { label: string; href: string }[]).map(({ label, href }) => (
            <a key={href} href={href}
              style={{ fontSize: 14, fontWeight: 500, color: C.sub,
                transition: `color 150ms ${EASE}` }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.sub; }}>
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center justify-end gap-2.5">
          {/* 알림 버튼 */}
          <button className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "#f0edff" }} aria-label="알림">
            <svg width="17" height="17" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M9 2C6.24 2 4 4.24 4 7V11L2.5 13H15.5L14 11V7C14 4.24 11.76 2 9 2Z"
                stroke={C.primary} strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M7.5 14.5C7.5 15.33 8.17 16 9 16C9.83 16 10.5 15.33 10.5 14.5"
                stroke={C.primary} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>

          {/* 로그인 상태에 따라 분기 */}
          {user ? (
            /* 로그인 됨 — 아바타 + 드롭다운 */
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                aria-label="프로필 메뉴"
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  overflow: "hidden", border: `2px solid ${C.secondary}`,
                  background: C.primary, cursor: "pointer", padding: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="아바타"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                    {(nickname ?? user.email ?? "U")[0].toUpperCase()}
                  </span>
                )}
              </button>

              {/* 드롭다운 메뉴 */}
              {dropdownOpen && (
                <div style={{
                  position: "absolute", top: 42, right: 0,
                  minWidth: 196, background: "#fff", borderRadius: 16,
                  boxShadow: "0 8px 24px rgba(108,60,225,0.12)",
                  padding: "6px 0", zIndex: 100,
                  border: "1px solid rgba(108,60,225,0.08)",
                }}>
                  {/* 유저 정보 */}
                  <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid rgba(108,60,225,0.08)" }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.primary, margin: 0 }}>
                      {nickname ?? user.email?.split("@")[0]}
                    </p>
                    <p style={{ fontSize: 11, color: C.sub, marginTop: 3, margin: "3px 0 0" }}>
                      {user.email}
                    </p>
                  </div>

                  {/* 메뉴 항목 */}
                  {(
                    [
                      { label: "내 대회",   href: "/my-tournaments" },
                      { label: "찜한 대회", href: "/wishlist"        },
                      { label: "내 정보",   href: "/profile"         },
                    ] as { label: string; href: string }[]
                  ).map(({ label, href }) => (
                    <a key={href} href={href}
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: "block", padding: "10px 16px",
                        fontSize: 14, color: C.text, textDecoration: "none",
                        transition: `background 120ms ${EASE}`,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#f8f7ff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}>
                      {label}
                    </a>
                  ))}

                  {/* 구분선 + 로그아웃 */}
                  <div style={{ borderTop: "1px solid rgba(108,60,225,0.08)", marginTop: 4 }} />
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%", textAlign: "left",
                      padding: "10px 16px", background: "none", border: "none",
                      fontSize: 14, color: "#EF4444", cursor: "pointer",
                      transition: `background 120ms ${EASE}`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF2F2"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}>
                    로그아웃
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* 로그인 안 됨 — 로그인 버튼 */
            <a href="/login"
              className="hidden md:flex h-9 px-5 rounded-xl text-sm text-white items-center"
              style={{
                background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                fontWeight: 600, transition: `filter 150ms ${EASE}`,
                textDecoration: "none",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.12)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = "brightness(1)"; }}>
              로그인
            </a>
          )}
        </div>
      </div>
    </header>
  );
}

// ── 히어로 ────────────────────────────────────────────────────────────────────
function Hero({ search, onSearch, count }: {
  search: string; onSearch: (v: string) => void; count: number;
}) {
  return (
    <section className="relative w-full py-16 md:py-24 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #f0edff 0%, #e8e3ff 50%, #f8f7ff 100%)" }}>
      <div style={{
        position: "absolute", top: -40, right: -40,
        width: 200, height: 200, borderRadius: "50%",
        background: "rgba(108,60,225,0.08)", pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: 20, left: -30,
        width: 150, height: 150, borderRadius: "50%",
        background: "rgba(27,20,100,0.06)", pointerEvents: "none",
      }} />

      <div className="relative max-w-[680px] mx-auto px-6 text-center">
        <div className="inline-flex items-center mb-8"
          style={{ gap: 5, background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
            color: "#fff", borderRadius: 100, fontSize: 13, fontWeight: 500, padding: "6px 16px" }}>
          <span aria-hidden>⚡</span>
          모든 종목의 대회, 한 곳에서
        </div>

        <h1 className="text-5xl md:text-7xl leading-[1.08] mb-5"
          style={{ fontWeight: 800, letterSpacing: "-0.03em", color: C.text }}>
          나의{" "}
          <span style={{
            background: `linear-gradient(135deg, ${C.primary} 0%, ${C.secondary} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>무대</span>를<br />찾아보세요
        </h1>

        <p className="text-base mb-10"
          style={{ color: C.sub, lineHeight: 1.6, fontWeight: 400 }}>
          원하는 종목, 지역, 날짜의 대회를 한눈에 확인하고<br className="hidden md:block" />
          바로 신청하세요
        </p>

        <div className="relative max-w-[560px] mx-auto">
          <svg className="absolute pointer-events-none"
            style={{ left: 18, top: "50%", transform: "translateY(-50%)" }}
            width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="6" stroke="#AEAEB2" strokeWidth="1.8"/>
            <path d="M13 13L16.5 16.5" stroke="#AEAEB2" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input type="text" value={search} onChange={(e) => onSearch(e.target.value)}
            placeholder="대회명, 종목, 지역으로 검색..."
            className="w-full pl-12 pr-12 text-sm outline-none"
            style={{ height: 56, borderRadius: 16,
              border: "1px solid rgba(108,60,225,0.25)",
              background: "rgba(255,255,255,0.95)", color: C.text, fontWeight: 400,
              transition: `border-color 200ms ${EASE}, box-shadow 200ms ${EASE}` }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = C.secondary;
              e.currentTarget.style.boxShadow = `0 0 0 3px rgba(108,60,225,0.12)`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "rgba(108,60,225,0.25)";
              e.currentTarget.style.boxShadow = "none";
            }} />
          {search && (
            <button onClick={() => onSearch("")}
              className="absolute top-1/2 -translate-y-1/2" style={{ right: 16 }}
              aria-label="검색어 지우기">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="8" fill="#C7C7CC"/>
                <path d="M6 6L12 12M12 6L6 12" stroke="#fff"
                  strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {count > 0 && (
          <p className="mt-4 text-xs" style={{ color: C.sub }}>
            현재{" "}
            <span style={{ fontWeight: 700, color: C.primary,
              fontVariantNumeric: "tabular-nums" }}>
              {count}개
            </span>의 대회가 열려 있어요
          </p>
        )}
      </div>
    </section>
  );
}

// ── 필터 칩 / 바 ──────────────────────────────────────────────────────────────
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      flexShrink: 0, height: 30, padding: "0 12px", borderRadius: 100,
      border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500,
      background: active ? C.primary : "rgba(108,60,225,0.08)",
      color:      active ? "#fff"    : "#4C1D95",
      transition: `all 200ms ${EASE}`,
    }}
    onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.96)"; }}
    onMouseUp={(e)   => { e.currentTarget.style.transform = "scale(1)"; }}>
      {label}
    </button>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
      {/* 고정 라벨 */}
      <span style={{
        flexShrink: 0, fontSize: 11, fontWeight: 700,
        color: "#9CA3AF", letterSpacing: "0.06em",
        marginRight: 10, whiteSpace: "nowrap",
        textTransform: "uppercase",
      }}>
        {label}
      </span>
      {/* 스크롤 영역 + 오른쪽 fade */}
      <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
        <div className="scrollbar-hide" style={{
          display: "flex", gap: 6, overflowX: "auto",
          paddingRight: 32,
        }}>
          {children}
        </div>
        {/* fade-out 힌트 */}
        <div style={{
          position: "absolute", top: 0, right: 0, width: 40, height: "100%",
          background: "linear-gradient(to right, transparent, rgba(248,247,255,0.95))",
          pointerEvents: "none",
        }} />
      </div>
    </div>
  );
}

function FilterBar({ sport, region, dateDays, onSport, onRegion, onDate }: {
  sport: string|null; region: string|null; dateDays: number|null;
  onSport: (v: string|null) => void;
  onRegion: (v: string|null) => void;
  onDate: (v: number|null) => void;
}) {
  return (
    <div className="sticky z-40" style={{ top: 64,
      background: "rgba(248,247,255,0.95)", backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderBottom: "0.5px solid rgba(108,60,225,0.12)" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-3" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <FilterRow label="종목">
          {SPORT_FILTERS.map((s) => (
            <Chip key={s} label={s} active={sport === s}
              onClick={() => onSport(sport === s ? null : s)} />
          ))}
        </FilterRow>
        <FilterRow label="지역">
          {REGION_FILTERS.map((r) => (
            <Chip key={r} label={r} active={region === r}
              onClick={() => onRegion(region === r ? null : r)} />
          ))}
        </FilterRow>
        <FilterRow label="날짜">
          {DATE_FILTERS.map(({ label, days }) => (
            <Chip key={label} label={label} active={dateDays === days}
              onClick={() => onDate(dateDays === days ? null : days)} />
          ))}
        </FilterRow>
      </div>
    </div>
  );
}

// ── D-day 뱃지 ────────────────────────────────────────────────────────────────
function DdayBadge({ dday }: { dday: number }) {
  const urgent = dday >= 0 && dday <= 7;
  return (
    <span className="font-suit font-extrabold"
      style={{ fontSize: 11, fontVariantNumeric: "tabular-nums",
        letterSpacing: "0.04em",
        padding: "3px 8px", borderRadius: 8, whiteSpace: "nowrap",
        background: "#ffffff",
        color:      urgent ? C.secondary : C.sub,
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}>
      {dday === 0 ? "D-DAY" : dday < 0 ? `D+${Math.abs(dday)}` : `D-${dday}`}
    </span>
  );
}

// ── 카드 하트 버튼 ────────────────────────────────────────────────────────────
function CardWishlistBtn({
  tournamentId, isWishlisted, onToggle,
}: {
  tournamentId: string;
  isWishlisted: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onToggle(tournamentId); }}
      aria-label={isWishlisted ? "찜 해제" : "찜하기"}
      style={{
        width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
        border: `1px solid ${isWishlisted ? "#E24B4A" : "rgba(0,0,0,0.10)"}`,
        background: isWishlisted ? "#FFF0F0" : "rgba(255,255,255,0.92)",
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
        transition: `all 180ms ${EASE}`,
      }}
      onMouseDown={(e) => { e.stopPropagation(); e.currentTarget.style.transform = "scale(0.85)"; }}
      onMouseUp={(e)   => { e.currentTarget.style.transform = "scale(1)"; }}>
      <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
        <path d="M11 19C11 19 2 13.5 2 7.5C2 5.01 4.01 3 6.5 3C8.24 3 9.76 3.97 10.65 5.44L11 6L11.35 5.44C12.24 3.97 13.76 3 15.5 3C17.99 3 20 5.01 20 7.5C20 13.5 11 19 11 19Z"
          fill={isWishlisted ? "#E24B4A" : "none"}
          stroke={isWishlisted ? "#E24B4A" : "#AEAEB2"}
          strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// ── 대회 카드 ─────────────────────────────────────────────────────────────────
function TournamentCard({
  t, onSelect, user, wishlisted, onWishlistToggle,
}: {
  t: Tournament;
  onSelect: (id: string) => void;
  user: User | null;
  wishlisted: Set<string>;
  onWishlistToggle: (id: string) => void;
}) {
  const dday   = getDday(t.start_date);
  const urgent = dday >= 0 && dday <= 7;
  const cat    = CAT_STYLE[t.sports?.category ?? ""] ?? CAT_DEFAULT;
  const ref    = useRef<HTMLElement>(null);

  const s0   = "0 2px 8px rgba(108,60,225,0.08)";
  const sHov = "0 8px 24px rgba(108,60,225,0.14)";

  return (
    <article ref={ref}
      className="relative bg-white flex flex-col cursor-pointer group"
      style={{ borderRadius: 20, padding: "24px 24px 16px",
        border: `1px solid ${urgent ? "#DDD0FF" : "rgba(108,60,225,0.10)"}`,
        boxShadow: s0,
        transition: `transform 200ms cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 200ms cubic-bezier(0.25,0.46,0.45,0.94), border-color 200ms` }}
      onMouseEnter={() => {
        if (!ref.current) return;
        ref.current.style.boxShadow = sHov;
        ref.current.style.transform = "translateY(-2px)";
        ref.current.style.borderColor = urgent ? "#C4B5FD" : "rgba(108,60,225,0.22)";
      }}
      onMouseLeave={() => {
        if (!ref.current) return;
        ref.current.style.boxShadow = s0;
        ref.current.style.transform = "translateY(0)";
        ref.current.style.borderColor = urgent ? "#DDD0FF" : "rgba(108,60,225,0.10)";
      }}
      onMouseDown={() => { if (ref.current) ref.current.style.transform = "scale(0.99)"; }}
      onMouseUp={() => { if (ref.current) ref.current.style.transform = "translateY(-2px)"; }}
      onClick={() => onSelect(t.id)}>

      {/* 우측 상단: D-day 배지 + (로그인 시) 하트 버튼 */}
      <div style={{ position: "absolute", top: 12, right: 12,
        display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
        <DdayBadge dday={dday} />
        <CardWishlistBtn
          tournamentId={t.id}
          isWishlisted={wishlisted.has(t.id)}
          onToggle={onWishlistToggle}
        />
      </div>

      <div className="flex items-center gap-2 mb-3.5" style={{ paddingRight: 64 }}>
        <span className="font-suit font-bold"
          style={{ display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, padding: "3px 9px",
            borderRadius: 100, background: cat.bg, color: cat.fg }}>
          {t.sports?.emoji && <span style={{ fontSize: 13 }}>{t.sports.emoji}</span>}
          {t.sports?.name ?? "기타"}
        </span>
      </div>

      <h3 className="line-clamp-2 mb-3 group-hover:text-[#6C3CE1] transition-colors duration-200 font-suit font-extrabold"
        style={{ fontSize: 15, lineHeight: 1.45,
          letterSpacing: "-0.015em", color: C.text, flex: 1 }}>
        {t.title}
      </h3>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs" style={{ color: "#4B5563" }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
            <rect x="0.5" y="1.5" width="12" height="10.5" rx="2" stroke="#4B5563" strokeWidth="1.2"/>
            <path d="M4 0.5L4 2.5M9 0.5L9 2.5M0.5 5.5L12.5 5.5"
              stroke="#4B5563" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmtDate(t.start_date)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: "#4B5563" }}>
          <svg width="11" height="13" viewBox="0 0 11 14" fill="none" aria-hidden>
            <path d="M5.5 1C3.57 1 2 2.57 2 4.5C2 7.25 5.5 13 5.5 13C5.5 13 9 7.25 9 4.5C9 2.57 7.43 1 5.5 1Z"
              stroke="#4B5563" strokeWidth="1.2"/>
            <circle cx="5.5" cy="4.5" r="1.4" stroke="#4B5563" strokeWidth="1.1"/>
          </svg>
          <span>{t.region}{t.location &&
            <span style={{ color: "#4B5563" }}> · {t.location}</span>}
          </span>
        </div>
      </div>

      <div style={{ height: 1, background: "#f0edff", margin: "16px 0" }} />

      <div className="flex items-center justify-between gap-3">
        <span style={{ fontSize: 14, fontWeight: 700,
          fontVariantNumeric: "tabular-nums", color: C.text }}>
          {t.fee == null
            ? "금액 미정"
            : t.fee === 0
              ? <span className="font-suit font-bold" style={{ background: "#D1FAE5", color: "#047857",
                  borderRadius: 100, padding: "4px 10px",
                  fontSize: 12 }}>무료</span>
              : `${t.fee.toLocaleString()}원`}
        </span>
        <button onClick={(e) => { e.stopPropagation(); onSelect(t.id); }}
          className="font-suit font-bold"
          style={{ display: "flex", alignItems: "center", gap: 5,
            height: 34, padding: "0 14px", borderRadius: 12,
            background: `linear-gradient(135deg, #3D2FA0, #8B5CF6)`,
            color: "#fff", fontSize: 12, border: "none", cursor: "pointer",
            transition: `filter 150ms ${EASE}, transform 150ms ${EASE}` }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = "brightness(1)"; }}
          onMouseDown={(e) =>  { e.currentTarget.style.transform = "scale(0.97)"; }}
          onMouseUp={(e) =>    { e.currentTarget.style.transform = "scale(1)"; }}>
          자세히 보기
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2.5 6H9.5M7 3.5L9.5 6L7 8.5"
              stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {urgent && dday >= 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 7,
          margin: "12px -24px -16px", padding: "9px 24px",
          background: "#EDE0FF", borderTop: "1px solid #DDD0FF",
          borderRadius: "0 0 20px 20px" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%",
            background: C.secondary, animation: "pulse 1.5s infinite" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: C.secondary }}>
            {dday === 0 ? "오늘 마감이에요!" : `마감 ${dday}일 전이에요`}
          </span>
        </div>
      )}
    </article>
  );
}

// ── 스피너 ────────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex justify-center items-center py-8">
      <div style={{
        width: 28, height: 28, borderRadius: "50%",
        border: `3px solid rgba(108,60,225,0.15)`,
        borderTopColor: C.secondary,
        animation: "spin 0.7s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── 빈·에러 상태 ──────────────────────────────────────────────────────────────
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="col-span-full flex flex-col items-center py-28 gap-4 text-center">
      <div style={{ width: 72, height: 72, borderRadius: 24, background: "#EDE8FF",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🏆</div>
      <div>
        <p style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em",
          color: C.text, marginBottom: 6 }}>
          {hasFilters ? "조건에 맞는 대회가 없어요" : "등록된 대회가 없어요"}
        </p>
        <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.6 }}>
          {hasFilters ? "다른 필터를 선택하거나 검색어를 바꿔보세요"
                      : "곧 새로운 대회가 등록될 예정이에요"}
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center py-28 gap-4 text-center">
      <div style={{ width: 72, height: 72, borderRadius: 24, background: "#EDE0FF",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden>
          <circle cx="16" cy="16" r="14" stroke={C.secondary} strokeWidth="2"/>
          <path d="M16 10L16 18" stroke={C.secondary} strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="16" cy="23" r="1.8" fill={C.secondary}/>
        </svg>
      </div>
      <div>
        <p style={{ fontSize: 17, fontWeight: 600, color: C.text, marginBottom: 6 }}>
          데이터를 불러오지 못했어요
        </p>
        <p style={{ fontSize: 12, color: C.sub, lineHeight: 1.6,
          maxWidth: 280, wordBreak: "break-all" }}>{message}</p>
      </div>
    </div>
  );
}

// ── 푸터 ─────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background: "#f8f7ff",
      borderTop: "0.5px solid rgba(108,60,225,0.12)", marginTop: "auto" }}>
      <div className="max-w-[1200px] mx-auto px-6 py-8
        flex flex-col md:flex-row items-center justify-between gap-4">
        <Logo size="sm" id="gFtr" />
        <p style={{ fontSize: 12, color: C.sub }}>© 2026 Warriors. All rights reserved.</p>
        <div className="flex gap-5">
          {["서비스 소개", "개인정보처리방침", "이용약관"].map((t) => (
            <a key={t} href="#"
              style={{ fontSize: 12, color: C.sub, transition: `color 150ms ${EASE}` }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.sub; }}>
              {t}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ── 메인 HomeClient ───────────────────────────────────────────────────────────
export default function HomeClient({
  tournaments, errorMessage,
}: { tournaments: Tournament[]; errorMessage: string | null }) {
  const router      = useRouter();
  const searchParams = useSearchParams();

  const [search,      setSearch]      = useState("");
  const [sport,       setSport]       = useState<string|null>(null);
  const [region,      setRegion]      = useState<string|null>(null);
  const [dateDays,    setDateDays]    = useState<number|null>(null);
  const [currentUser,   setCurrentUser]   = useState<User | null>(null);
  const [wishlisted,    setWishlisted]    = useState<Set<string>>(new Set());
  const [toastMsg,      setToastMsg]      = useState("");
  const [toastVisible,  setToastVisible]  = useState(false);
  const [toastDuration, setToastDuration] = useState(1500);

  const [displayCount, setDisplayCount] = useState(PAGE_SZ);
  const [isLoading,    setIsLoading]    = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => tournaments.filter((t) => {
    const q = search.toLowerCase();
    if (q && !t.title.toLowerCase().includes(q) &&
        !t.region.toLowerCase().includes(q) &&
        !(t.sports?.name ?? "").toLowerCase().includes(q)) return false;
    if (sport    && t.sports?.category !== sport)  return false;
    if (region   && t.region           !== region) return false;
    if (dateDays != null) {
      const d = getDday(t.start_date);
      if (d < 0 || d > dateDays) return false;
    }
    return true;
  }), [tournaments, search, sport, region, dateDays]);

  // 필터 변경 시 목록 초기화
  useEffect(() => {
    setDisplayCount(PAGE_SZ);
    setIsLoading(false);
  }, [search, sport, region, dateDays]);

  const displayed = useMemo(
    () => filtered.slice(0, displayCount),
    [filtered, displayCount]
  );
  const hasMore = displayCount < filtered.length;

  // 추가 로드 실행
  const loadMore = useCallback(() => {
    setIsLoading(true);
  }, []);

  useEffect(() => {
    if (!isLoading) return;
    const t = setTimeout(() => {
      setDisplayCount((prev) => Math.min(prev + PAGE_SZ, filtered.length));
      setIsLoading(false);
    }, 350);
    return () => clearTimeout(t);
  }, [isLoading, filtered.length]);

  // IntersectionObserver — sentinel 감지
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || isLoading) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadMore(); },
      { rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  // 로그인 유저 및 찜 목록 초기화 + 로그아웃 감지
  useEffect(() => {
    const supabase = createClientSupabaseClient();

    // 초기 세션 확인
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setCurrentUser(user);
      getWishlistedIds().then(setWishlisted);
    });

    // 인증 상태 변화 구독 (로그아웃 시 찜 상태 초기화)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setCurrentUser(null);
        setWishlisted(new Set());
      } else if (event === "SIGNED_IN" && session?.user) {
        setCurrentUser(session.user);
        getWishlistedIds().then(setWishlisted);
      }
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  // URL 파라미터 → 필터 상태 동기화 (초기 로드 + 브라우저 뒤로/앞으로)
  useEffect(() => {
    setSport(searchParams.get("category"));
    setRegion(searchParams.get("region"));
    setSearch(searchParams.get("search") ?? "");
    const per = searchParams.get("period");
    setDateDays(
      per === "week"    ? 7  :
      per === "month"   ? 30 :
      per === "3months" ? 90 : null
    );
  }, [searchParams]);

  // 필터 상태 → URL 파라미터 업데이트
  const updateURL = useCallback((
    sport_:    string | null,
    region_:   string | null,
    dateDays_: number | null,
    search_:   string,
  ) => {
    const p = new URLSearchParams();
    if (sport_)    p.set("category", sport_);
    if (region_)   p.set("region",   region_);
    const periodKey =
      dateDays_ === 7  ? "week"    :
      dateDays_ === 30 ? "month"   :
      dateDays_ === 90 ? "3months" : null;
    if (periodKey) p.set("period",   periodKey);
    if (search_)   p.set("search",   search_);
    const qs = p.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  }, [router]);

  const showToast = useCallback((msg: string, duration = 1500) => {
    setToastMsg(msg);
    setToastDuration(duration);
    setToastVisible(true);
  }, []);

  const handleWishlistToggle = useCallback(async (tournamentId: string) => {
    if (!currentUser) {
      showToast("찜하려면 로그인이 필요해요", 1200);
      setTimeout(() => router.push("/login"), 1200);
      return;
    }
    const isCurrently = wishlisted.has(tournamentId);
    // Optimistic update
    setWishlisted((prev) => {
      const next = new Set(prev);
      isCurrently ? next.delete(tournamentId) : next.add(tournamentId);
      return next;
    });
    const result = await toggleWishlist(tournamentId, isCurrently);
    if (result.ok) {
      showToast(isCurrently ? "찜 목록에서 제거됐어요" : "찜 목록에 추가됐어요 ❤️");
    } else {
      // 실패 시 롤백
      setWishlisted((prev) => {
        const next = new Set(prev);
        isCurrently ? next.add(tournamentId) : next.delete(tournamentId);
        return next;
      });
    }
  }, [currentUser, wishlisted, router, showToast]);

  const hasFilters = !!(search || sport || region || dateDays != null);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header onAfterLogout={() => showToast("로그아웃 됐어요", 1000)} />
      {/* PC: 상단 / 모바일: 하단 탭바 위 */}
      <div className="hidden md:block">
        <Toast visible={toastVisible} message={toastMsg} duration={toastDuration}
          onClose={() => setToastVisible(false)} position="top" />
      </div>
      <div className="md:hidden">
        <Toast visible={toastVisible} message={toastMsg} duration={toastDuration}
          onClose={() => setToastVisible(false)} position="bottom" />
      </div>
      <Hero
        search={search}
        onSearch={(v) => { setSearch(v); updateURL(sport, region, dateDays, v); }}
        count={tournaments.length}
      />
      <FilterBar sport={sport} region={region} dateDays={dateDays}
        onSport={(v)  => { setSport(v);    updateURL(v,     region,   dateDays, search); }}
        onRegion={(v) => { setRegion(v);   updateURL(sport, v,        dateDays, search); }}
        onDate={(v)   => { setDateDays(v); updateURL(sport, region,   v,        search); }}
      />

      <main className="flex-1 py-10" style={{ background: "#f8f7ff" }}>
        <div className="max-w-[1200px] mx-auto px-6">

          {/* 결과 카운트 / 필터 초기화 */}
          {!errorMessage && (
            <div className="flex items-center justify-between mb-6">
              <p style={{ fontSize: 13, color: C.sub }}>
                대회{" "}
                <span style={{ fontWeight: 700, color: C.text,
                  fontVariantNumeric: "tabular-nums" }}>
                  {filtered.length}개
                </span>
                {hasFilters && " (필터 적용됨)"}
              </p>
              {hasFilters && (
                <button onClick={() => {
                  setSearch(""); setSport(null); setRegion(null); setDateDays(null);
                  router.replace("/", { scroll: false });
                }} style={{ display: "flex", alignItems: "center", gap: 5,
                  fontSize: 12, fontWeight: 600, color: C.secondary,
                  background: "none", border: "none", cursor: "pointer",
                  transition: `opacity 150ms ${EASE}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.65"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path d="M10.5 2C9.5 0.8 8.1 0 6.5 0C3.46 0 1 2.46 1 5.5S3.46 11 6.5 11C9 11 11.1 9.4 11.8 7.1"
                      stroke={C.secondary} strokeWidth="1.4" strokeLinecap="round"/>
                    <path d="M8 0L10.5 2L8 4"
                      stroke={C.secondary} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  필터 초기화
                </button>
              )}
            </div>
          )}

          {/* 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {errorMessage ? (
              <ErrorState message={errorMessage} />
            ) : filtered.length === 0 ? (
              <EmptyState hasFilters={hasFilters} />
            ) : (
              displayed.map((t) => (
                <TournamentCard key={t.id} t={t}
                  onSelect={(id) => router.push(`/tournaments/${id}`)}
                  user={currentUser}
                  wishlisted={wishlisted}
                  onWishlistToggle={handleWishlistToggle} />
              ))
            )}
          </div>

          {/* 무한 스크롤 sentinel + 상태 */}
          {!errorMessage && filtered.length > 0 && (
            <>
              {/* sentinel: 이 div가 뷰포트에 들어오면 로드 트리거 */}
              <div ref={sentinelRef} style={{ height: 1 }} />

              {isLoading && <Spinner />}

              {!hasMore && displayed.length > 0 && (
                <p className="text-center py-8"
                  style={{ fontSize: 13, color: C.sub }}>
                  ✓ 모든 대회를 확인했어요
                </p>
              )}
            </>
          )}
        </div>
      </main>

      <div className="md:hidden" style={{ height: 60 }} />
      <Footer />
    </div>
  );
}
