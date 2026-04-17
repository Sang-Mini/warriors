"use client";

import { useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";

const C = {
  primary:   "#1B1464",
  secondary: "#6C3CE1",
  accent:    "#00D4FF",
  sub:       "#6B7280",
  text:      "#0D0D2B",
  border:    "#E5E7FF",
} as const;

const EASE = "cubic-bezier(0.4,0,0.2,1)";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
      <path
        d="M44.5 20H24v8.5h11.7C34.2 33.9 29.6 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 6 1.1 8.1 3l6.1-6.1C34.8 4.5 29.7 2 24 2 12.4 2 3 11.4 3 23s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.2-2.7-.5-4z"
        fill="#4285F4"
      />
      <path
        d="M6.3 14.7l7.1 5.2C15.2 16 19.3 13 24 13c3.1 0 6 1.1 8.1 3l6.1-6.1C34.8 4.5 29.7 2 24 2 16.3 2 9.7 7.4 6.3 14.7z"
        fill="#EA4335"
      />
      <path
        d="M24 44c5.5 0 10.5-1.9 14.3-5.1l-6.6-5.4C29.7 35.5 27 36.5 24 36.5c-5.6 0-10.3-3.8-11.9-9l-7 5.4C8.4 40.1 15.6 44 24 44z"
        fill="#34A853"
      />
      <path
        d="M44.5 20H24v8.5h11.7c-.8 2.3-2.3 4.3-4.3 5.7l6.6 5.4C41.6 36.2 44.5 30 44.5 23c0-1.3-.2-2-.5-3z"
        fill="#FBBC05"
      />
    </svg>
  );
}

function WarriorsLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="28" height="22" viewBox="0 0 38 30" fill="none" aria-hidden>
        <defs>
          <linearGradient id="wGradMyT" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={C.primary}   />
            <stop offset="100%" stopColor={C.secondary} />
          </linearGradient>
        </defs>
        <path
          d="M2 4 L10 26 L19 11 L28 26 L36 4"
          stroke="url(#wGradMyT)"
          strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
      <div className="flex items-center gap-1.5">
        <span
          style={{ fontSize: 20, letterSpacing: "0.2em", color: C.text,
            fontFamily: "var(--font-bebas)", fontWeight: 400 }}
        >
          WARRIORS
        </span>
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path
            d="M5 0 L6.1 3.4 L9.8 3.4 L6.9 5.5 L8 8.9 L5 6.8 L2 8.9 L3.1 5.5 L0.2 3.4 L3.9 3.4 Z"
            fill={C.accent}
          />
        </svg>
      </div>
    </div>
  );
}

// ── 로그인 유도 ───────────────────────────────────────────────────────────────
function LoginPrompt() {
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    const supabase = createClientSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
      <div
        style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "#f0edff",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
            stroke={C.secondary} strokeWidth="1.6" strokeLinecap="round"
          />
          <path
            d="M3 21C3 17.134 7.02944 14 12 14C16.9706 14 21 17.134 21 21"
            stroke={C.secondary} strokeWidth="1.6" strokeLinecap="round"
          />
        </svg>
      </div>
      <div>
        <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>
          로그인 후 이용 가능해요
        </p>
        <p style={{ fontSize: 13, color: C.sub }}>
          내가 신청한 대회를 한 곳에서 관리하세요
        </p>
      </div>
      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        style={{
          height: 52, borderRadius: 12,
          border: "1px solid #e5e7eb", background: "#ffffff",
          color: "#000000", display: "flex", alignItems: "center",
          justifyContent: "center", gap: 10,
          fontSize: 15, fontWeight: 500, padding: "0 28px",
          cursor: loading ? "wait" : "pointer",
          transition: `background 150ms ${EASE}`,
          opacity: loading ? 0.7 : 1,
        }}
        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#fafafa"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
      >
        <GoogleIcon />
        {loading ? "연결 중…" : "Google로 계속하기"}
      </button>
    </div>
  );
}

// ── 빈 상태 ───────────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div
        style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "#fff0f5",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 21C12 21 3 15.5 3 9.5C3 7.01 5.01 5 7.5 5C9.24 5 10.91 5.99 12 7.5C13.09 5.99 14.76 5 16.5 5C18.99 5 21 7.01 21 9.5C21 15.5 12 21 12 21Z"
            stroke="#F43F5E" strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6 }}>
          신청한 대회가 없어요
        </p>
        <p style={{ fontSize: 13, color: C.sub }}>
          관심 있는 대회를 찾아 신청해보세요
        </p>
      </div>
      <a
        href="/"
        style={{
          height: 44, borderRadius: 10, padding: "0 24px",
          background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
          color: "#ffffff", display: "flex", alignItems: "center",
          fontSize: 14, fontWeight: 600, textDecoration: "none",
          boxShadow: "0 4px 12px rgba(27,20,100,0.2)",
          transition: `opacity 150ms ${EASE}`,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.88"; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
      >
        대회 찾아보기
      </a>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function MyTournamentsClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50" style={{
        height: 60, background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: "0.5px solid rgba(108,60,225,0.10)",
      }}>
        <div className="max-w-[1200px] mx-auto px-6 h-full flex items-center justify-between">
          <button onClick={() => window.location.href = "/"} aria-label="홈으로"
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
          <WarriorsLogo />
          <div style={{ width: 80 }} />
        </div>
      </header>

      {/* 본문 */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full px-6 pt-10 pb-20">
        {/* 페이지 타이틀 */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 4 }}>
            내 대회
          </h1>
          <p style={{ fontSize: 13, color: C.sub }}>
            {isLoggedIn ? "신청한 대회 목록이에요" : "로그인하고 대회를 관리하세요"}
          </p>
        </div>

        {isLoggedIn ? <EmptyState /> : <LoginPrompt />}
      </div>
    </div>
  );
}
