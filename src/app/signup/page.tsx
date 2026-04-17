"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// ── 디자인 토큰 ───────────────────────────────────────────────────────────────
const C = {
  primary:   "#1B1464",
  secondary: "#6C3CE1",
  sub:       "#6E6E73",
} as const;

const EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

export default function SignupPage() {
  const router = useRouter();
  const [user, setUser]                       = useState<User | null>(null);
  const [nickname, setNickname]               = useState("");
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [checking, setChecking]               = useState(true);
  const [error, setError]                     = useState<string | null>(null);

  // 로그인 세션 확인
  useEffect(() => {
    const supabase = createClientSupabaseClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) {
        router.replace("/login");
      } else {
        setUser(u);
        // 카카오/Google 메타데이터에서 닉네임 pre-fill (최대 10자)
        const metaNickname =
          (u.user_metadata?.name as string | undefined) ??
          (u.user_metadata?.full_name as string | undefined) ??
          (u.user_metadata?.preferred_username as string | undefined) ??
          "";
        if (metaNickname) setNickname(metaNickname.slice(0, 10));
        setChecking(false);
      }
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || nickname.trim().length === 0) return;
    setLoading(true);
    setError(null);

    const supabase = createClientSupabaseClient();
    const { error: upsertError } = await supabase.from("users").upsert({
      id:                user.id,
      nickname:          nickname.trim(),
      marketing_agreed:  marketingAgreed,
      avatar_url:        (user.user_metadata?.avatar_url as string | undefined)
                      ?? (user.user_metadata?.picture   as string | undefined)
                      ?? null,
      provider:          (user.app_metadata?.provider as string | undefined) ?? "google",
    });

    if (upsertError) {
      setError(upsertError.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding");
  }

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #f0edff 0%, #ffffff 100%)",
        }}
      />
    );
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
        {/* 제목 */}
        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: C.primary,
            marginBottom: 6,
            letterSpacing: "-0.02em",
          }}
        >
          닉네임을 입력해주세요
        </h1>
        <p style={{ fontSize: 14, color: C.sub, marginBottom: 28, lineHeight: 1.5 }}>
          Warriors에서 사용할 이름을 정해보세요
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* 닉네임 입력 */}
          <div style={{ position: "relative", marginBottom: 8 }}>
            <input
              type="text"
              value={nickname}
              onChange={(e) => {
                const v = e.target.value;
                if (v.length <= 10) setNickname(v);
              }}
              placeholder="닉네임 (최대 10자)"
              maxLength={10}
              required
              style={{
                width: "100%",
                height: 52,
                borderRadius: 12,
                border: "1.5px solid #e5e7eb",
                padding: "0 16px",
                fontSize: 15,
                color: "#000",
                outline: "none",
                boxSizing: "border-box",
                transition: `border-color 200ms ${EASE}, box-shadow 200ms ${EASE}`,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = C.secondary;
                e.currentTarget.style.boxShadow   = `0 0 0 3px rgba(108,60,225,0.12)`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e5e7eb";
                e.currentTarget.style.boxShadow   = "none";
              }}
            />
          </div>

          {/* 글자 수 */}
          <p
            style={{
              textAlign: "right",
              fontSize: 11,
              color: "#AEAEB2",
              marginBottom: 24,
            }}
          >
            {nickname.length}/10
          </p>

          {/* 마케팅 수신 동의 */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              marginBottom: 28,
            }}
          >
            <input
              type="checkbox"
              checked={marketingAgreed}
              onChange={(e) => setMarketingAgreed(e.target.checked)}
              style={{ width: 18, height: 18, accentColor: C.secondary, cursor: "pointer" }}
            />
            <span style={{ fontSize: 13, color: C.sub, lineHeight: 1.4 }}>
              이벤트 및 마케팅 정보 수신 동의{" "}
              <span style={{ color: "#AEAEB2" }}>(선택)</span>
            </span>
          </label>

          {/* 에러 메시지 */}
          {error && (
            <p
              style={{
                fontSize: 13,
                color: "#EF4444",
                marginBottom: 16,
                padding: "10px 14px",
                background: "#FEF2F2",
                borderRadius: 8,
              }}
            >
              {error}
            </p>
          )}

          {/* 시작하기 버튼 */}
          <button
            type="submit"
            disabled={loading || nickname.trim().length === 0}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 12,
              border: "none",
              background:
                nickname.trim().length === 0
                  ? "#e5e7eb"
                  : `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
              color: nickname.trim().length === 0 ? "#AEAEB2" : "#ffffff",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading || nickname.trim().length === 0 ? "not-allowed" : "pointer",
              transition: `filter 150ms ${EASE}, background 200ms ${EASE}`,
              opacity: loading ? 0.8 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading && nickname.trim().length > 0)
                e.currentTarget.style.filter = "brightness(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "brightness(1)";
            }}
          >
            {loading ? "저장 중…" : "시작하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
