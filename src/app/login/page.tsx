"use client";

import { useState } from "react";
import { createClientSupabaseClient } from "@/lib/supabase/client";

// ── 디자인 토큰 ───────────────────────────────────────────────────────────────
const C = {
  primary:   "#1B1464",
  secondary: "#6C3CE1",
  sub:       "#6E6E73",
} as const;

// ── Google 아이콘 ─────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M47.532 24.552c0-1.636-.145-3.2-.415-4.695H24v9.169h13.222c-.583 2.978-2.29 5.5-4.84 7.19v5.978h7.818c4.574-4.213 7.332-10.42 7.332-17.642z"
        fill="#4285F4"
      />
      <path
        d="M24 48c6.48 0 11.916-2.148 15.888-5.806l-7.818-5.978c-2.148 1.44-4.896 2.29-8.07 2.29-6.198 0-11.45-4.185-13.32-9.81H2.582v6.166C6.54 42.556 14.726 48 24 48z"
        fill="#34A853"
      />
      <path
        d="M10.68 28.696A14.87 14.87 0 0 1 9.84 24c0-1.636.288-3.226.84-4.696v-6.166H2.582A23.94 23.94 0 0 0 0 24c0 3.876.934 7.543 2.582 10.862l8.098-6.166z"
        fill="#FBBC05"
      />
      <path
        d="M24 9.494c3.492 0 6.624 1.2 9.086 3.558l6.804-6.804C35.908 2.39 30.472 0 24 0 14.726 0 6.54 5.444 2.582 13.138l8.098 6.166C12.55 13.679 17.802 9.494 24 9.494z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    const supabase = createClientSupabaseClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #f0edff 0%, #ffffff 100%)",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          padding: "40px 36px",
          borderRadius: 24,
          background: "#ffffff",
          boxShadow:
            "0 4px 6px -1px rgba(0,0,0,0.05), 0 20px 40px -8px rgba(27,20,100,0.12)",
        }}
      >
        {/* 로고 */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <span
            style={{
              fontSize: 34,
              fontWeight: 400,
              letterSpacing: "0.12em",
              color: C.primary,
              fontFamily: "var(--font-bebas)",
            }}
          >
            WARRIORS
          </span>
        </div>

        {/* 부제 */}
        <p
          style={{
            fontSize: 15,
            color: C.sub,
            textAlign: "center",
            marginBottom: 28,
            lineHeight: 1.5,
          }}
        >
          나의 대회를 찾아보세요
        </p>

        {/* 구분선 */}
        <hr
          style={{
            border: "none",
            borderTop: "1px solid #f0f0f5",
            marginBottom: 28,
          }}
        />

        {/* Google 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            height: 52,
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            background: "#ffffff",
            color: "#000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontSize: 15,
            fontWeight: 500,
            cursor: loading ? "wait" : "pointer",
            transition: "background 150ms ease",
            opacity: loading ? 0.7 : 1,
          }}
          onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#fafafa"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#ffffff"; }}
        >
          <GoogleIcon />
          {loading ? "연결 중…" : "Google로 계속하기"}
        </button>

        {/* 하단 안내 */}
        <p
          style={{
            marginTop: 24,
            fontSize: 11,
            color: "#AEAEB2",
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          로그인하면 서비스 이용약관 및 개인정보처리방침에
          <br />
          동의하는 것입니다
        </p>
      </div>
    </div>
  );
}
