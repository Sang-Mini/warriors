"use client";

import { useRouter } from "next/navigation";
import Toast from "@/components/Toast";
import { useState } from "react";
import type { Tournament } from "@/app/HomeClient";

// ── 디자인 토큰 ───────────────────────────────────────────────────────────────
const C = {
  primary:   "#1B1464",
  secondary: "#6C3CE1",
  accent:    "#00D4FF",
  surface:   "#f8f7ff",
  text:      "#000000",
  sub:       "#6E6E73",
  border:    "rgba(108,60,225,0.12)",
} as const;

const EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

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

function fmtDate(s: string) {
  const d = new Date(s);
  const W = ["일","월","화","수","목","금","토"];
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth()+1)}.${p(d.getDate())} (${W[d.getDay()]})`;
}

// ── W 로고 ────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg width="30" height="24" viewBox="0 0 38 30" fill="none" aria-hidden>
        <defs>
          <linearGradient id="wGradApps" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={C.primary}   />
            <stop offset="100%" stopColor={C.secondary} />
          </linearGradient>
        </defs>
        <path d="M2 4 L10 26 L19 11 L28 26 L36 4"
          stroke="url(#wGradApps)" strokeWidth="4.5"
          strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex items-center gap-1.5">
        <span style={{ fontSize: 20, fontWeight: 400, letterSpacing: "0.18em", color: C.text,
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

// ── D-day 배지 ────────────────────────────────────────────────────────────────
function DdayBadge({ dday }: { dday: number }) {
  const urgent = dday >= 0 && dday <= 7;
  return (
    <span className="font-suit font-extrabold"
      style={{ fontSize: 11, fontVariantNumeric: "tabular-nums",
        letterSpacing: "0.04em",
        padding: "3px 8px", borderRadius: 8, whiteSpace: "nowrap",
        background: "#ffffff",
        color: urgent ? C.secondary : C.sub,
        boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}>
      {dday === 0 ? "D-DAY" : dday < 0 ? `D+${Math.abs(dday)}` : `D-${dday}`}
    </span>
  );
}

// ── 신청 대회 카드 ─────────────────────────────────────────────────────────────
function ApplicationCard({ t, onSelect }: { t: Tournament; onSelect: (id: string) => void }) {
  const dday   = getDday(t.start_date);
  const urgent = dday >= 0 && dday <= 7;
  const cat    = CAT_STYLE[t.sports?.category ?? ""] ?? CAT_DEFAULT;

  return (
    <article
      className="relative bg-white flex flex-col cursor-pointer"
      style={{ borderRadius: 20, padding: 24,
        border: `1px solid ${urgent ? "#DDD0FF" : "rgba(108,60,225,0.10)"}`,
        boxShadow: "0 2px 8px rgba(108,60,225,0.08)",
        transition: `transform 200ms ${EASE}, box-shadow 200ms ${EASE}` }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(108,60,225,0.14)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(108,60,225,0.08)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
      }}
      onClick={() => onSelect(t.id)}>

      {/* 우측 상단: D-day + 신청완료 뱃지 */}
      <div style={{ position: "absolute", top: 12, right: 12,
        display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5 }}>
        <DdayBadge dday={dday} />
        <span style={{
          fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 100,
          background: "#E0FFF0", color: "#065F46", border: "1px solid #86efac",
        }}>
          신청완료
        </span>
      </div>

      {/* 종목 배지 */}
      <div className="flex items-center gap-2 mb-3.5" style={{ paddingRight: 72 }}>
        <span className="font-suit font-bold"
          style={{ display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, padding: "3px 9px",
            borderRadius: 100, background: cat.bg, color: cat.fg }}>
          {t.sports?.emoji && <span style={{ fontSize: 13 }}>{t.sports.emoji}</span>}
          {t.sports?.name ?? "기타"}
        </span>
      </div>

      {/* 대회명 */}
      <h3 className="line-clamp-2 mb-3 font-suit font-extrabold"
        style={{ fontSize: 15, lineHeight: 1.45,
          letterSpacing: "-0.015em", color: C.text, flex: 1 }}>
        {t.title}
      </h3>

      {/* 날짜 + 지역 */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs" style={{ color: C.sub }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
            <rect x="0.5" y="1.5" width="12" height="10.5" rx="2" stroke="#AEAEB2" strokeWidth="1.2"/>
            <path d="M4 0.5L4 2.5M9 0.5L9 2.5M0.5 5.5L12.5 5.5"
              stroke="#AEAEB2" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>{fmtDate(t.start_date)}</span>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: C.sub }}>
          <svg width="11" height="13" viewBox="0 0 11 14" fill="none" aria-hidden>
            <path d="M5.5 1C3.57 1 2 2.57 2 4.5C2 7.25 5.5 13 5.5 13C5.5 13 9 7.25 9 4.5C9 2.57 7.43 1 5.5 1Z"
              stroke="#AEAEB2" strokeWidth="1.2"/>
            <circle cx="5.5" cy="4.5" r="1.4" stroke="#AEAEB2" strokeWidth="1.1"/>
          </svg>
          <span>{t.region}{t.location && <span style={{ color: "#AEAEB2" }}> · {t.location}</span>}</span>
        </div>
      </div>

      <div style={{ height: 1, background: "#f0edff", margin: "16px 0" }} />

      {/* 가격 + 자세히 */}
      <div className="flex items-center justify-between gap-3">
        <span style={{ fontSize: 14, fontWeight: 700,
          fontVariantNumeric: "tabular-nums", color: C.text }}>
          {t.fee == null
            ? "금액 미정"
            : t.fee === 0
              ? <span style={{ background: "#E0FFF0", color: "#065F46",
                  borderRadius: 100, padding: "2px 8px",
                  fontSize: 11, fontWeight: 700 }}>무료</span>
              : `${t.fee.toLocaleString()}원`}
        </span>
        <button onClick={(e) => { e.stopPropagation(); onSelect(t.id); }}
          className="font-suit font-semibold"
          style={{ display: "flex", alignItems: "center", gap: 5,
            height: 34, padding: "0 14px", borderRadius: 12,
            background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
            color: "#fff", fontSize: 12, border: "none", cursor: "pointer",
            transition: `filter 150ms ${EASE}` }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = "brightness(1.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = "brightness(1)"; }}>
          자세히 보기
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M2.5 6H9.5M7 3.5L9.5 6L7 8.5"
              stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {urgent && dday >= 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 7,
          margin: "12px -24px -24px", padding: "9px 24px",
          background: "#EDE0FF", borderTop: "1px solid #DDD0FF",
          borderRadius: "0 0 20px 20px" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%",
            background: C.secondary }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: C.secondary }}>
            {dday === 0 ? "오늘 마감이에요!" : `마감 ${dday}일 전이에요`}
          </span>
        </div>
      )}
    </article>
  );
}

// ── 빈 상태 ───────────────────────────────────────────────────────────────────
function EmptyState() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-28 gap-5 text-center">
      <div style={{ width: 80, height: 80, borderRadius: 28, background: "#EDE8FF",
        display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
            stroke={C.secondary} strokeWidth="1.6" strokeLinecap="round"/>
          <rect x="9" y="3" width="6" height="4" rx="1"
            stroke={C.secondary} strokeWidth="1.6"/>
          <path d="M9 12h6M9 16h4"
            stroke={C.secondary} strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      </div>
      <div>
        <p style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>
          아직 신청한 대회가 없어요
        </p>
        <p style={{ fontSize: 14, color: C.sub, lineHeight: 1.6 }}>
          대회에 신청하면 여기에 기록돼요
        </p>
      </div>
      <button
        onClick={() => router.push("/")}
        style={{ display: "flex", alignItems: "center", gap: 6,
          height: 44, padding: "0 24px", borderRadius: 12,
          background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
          color: "#fff", fontSize: 14, fontWeight: 600, border: "none",
          cursor: "pointer", boxShadow: "0 4px 16px rgba(27,20,100,0.22)" }}>
        대회 찾아보기
        <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2.5 6H9.5M7 3.5L9.5 6L7 8.5"
            stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function ApplicationsClient({ tournaments }: { tournaments: Tournament[] }) {
  const router = useRouter();
  const [toastMsg,     setToastMsg]     = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: C.surface }}>
      {/* 헤더 */}
      <header className="sticky top-0 z-50" style={{
        height: 60, background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "0.5px solid rgba(108,60,225,0.10)",
      }}>
        <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
          <button onClick={() => router.push("/")} aria-label="홈으로"
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
            홈으로
          </button>
          <Logo />
          <div style={{ width: 80 }} />
        </div>
      </header>

      {/* 페이지 타이틀 */}
      <div className="max-w-[1200px] mx-auto px-6 pt-10 pb-6 w-full" style={{ boxSizing: "border-box" }}>
        <div className="flex items-center gap-3">
          <div style={{ width: 40, height: 40, borderRadius: 14,
            background: "#EDE8FF", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
                stroke={C.secondary} strokeWidth="1.6" strokeLinecap="round"/>
              <rect x="9" y="3" width="6" height="4" rx="1"
                stroke={C.secondary} strokeWidth="1.6"/>
              <path d="M9 12h6M9 16h4"
                stroke={C.secondary} strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text,
              letterSpacing: "-0.02em", lineHeight: 1.2 }}>
              신청한 대회
            </h1>
            <p style={{ fontSize: 13, color: C.sub, marginTop: 2 }}>
              총{" "}
              <span style={{ fontWeight: 700, color: C.primary, fontVariantNumeric: "tabular-nums" }}>
                {tournaments.length}개
              </span>
              의 대회에 신청했어요
            </p>
          </div>
        </div>
      </div>

      {/* 콘텐츠 */}
      <main className="flex-1 pb-16">
        <div className="max-w-[1200px] mx-auto px-6" style={{ boxSizing: "border-box" }}>
          {tournaments.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tournaments.map((t) => (
                <ApplicationCard
                  key={t.id}
                  t={t}
                  onSelect={(id) => router.push(`/tournaments/${id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <footer style={{ background: "#f8f7ff", borderTop: "0.5px solid rgba(108,60,225,0.12)" }}>
        <div className="max-w-[1200px] mx-auto px-6 py-6">
          <p style={{ fontSize: 12, color: C.sub, textAlign: "center" }}>
            © 2026 Warriors. All rights reserved.
          </p>
        </div>
      </footer>

      <Toast
        message={toastMsg}
        visible={toastVisible}
        duration={2000}
        onClose={() => { setToastVisible(false); setToastMsg(""); }}
        position="top"
      />
    </div>
  );
}
