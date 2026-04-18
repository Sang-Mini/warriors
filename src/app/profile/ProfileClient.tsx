"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import Toast from "@/components/Toast";

// ── 디자인 토큰 ───────────────────────────────────────────────────────────────
const C = {
  primary:   "#1B1464",
  secondary: "#6C3CE1",
  accent:    "#00D4FF",
  text:      "#000000",
  sub:       "#6E6E73",
  border:    "rgba(108,60,225,0.12)",
} as const;

const EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

// ── props ─────────────────────────────────────────────────────────────────────
type Props = {
  userId:          string;
  email:           string | null;
  authCreatedAt:   string;
  nickname:        string | null;
  marketingAgreed: boolean;
  avatarUrl:       string | null;
  provider:        string;
};

// ── 헬퍼 ─────────────────────────────────────────────────────────────────────
function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

// ── W 로고 ────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg width="30" height="24" viewBox="0 0 38 30" fill="none" aria-hidden>
        <defs>
          <linearGradient id="wGradProfile" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={C.primary}   />
            <stop offset="100%" stopColor={C.secondary} />
          </linearGradient>
        </defs>
        <path d="M2 4 L10 26 L19 11 L28 26 L36 4"
          stroke="url(#wGradProfile)" strokeWidth="4.5"
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

// ── 섹션 카드 ─────────────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      border: `1px solid ${C.border}`,
      boxShadow: "0 2px 8px rgba(108,60,225,0.08)",
      overflow: "hidden",
    }}>
      {children}
    </div>
  );
}

// ── 정보 행 ───────────────────────────────────────────────────────────────────
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 20px", borderBottom: `1px solid ${C.border}`,
      gap: 12,
    }}>
      <span style={{ fontSize: 13, color: C.sub, flexShrink: 0, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: C.text, textAlign: "right" }}>
        {children}
      </span>
    </div>
  );
}

// ── 회원 탈퇴 확인 모달 ────────────────────────────────────────────────────────
function DeleteModal({ onConfirm, onCancel, loading }: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
    }}
      onClick={onCancel}
    >
      <div
        style={{
          width: "100%", maxWidth: 360,
          background: "#fff", borderRadius: 20,
          padding: "28px 24px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 14,
          background: "#FEF2F2", margin: "0 auto 16px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
            <circle cx="11" cy="11" r="10" stroke="#EF4444" strokeWidth="1.8"/>
            <path d="M11 7V12" stroke="#EF4444" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="11" cy="15.5" r="1.2" fill="#EF4444"/>
          </svg>
        </div>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: C.text,
          textAlign: "center", marginBottom: 8, letterSpacing: "-0.02em" }}>
          정말 탈퇴하시겠어요?
        </h2>
        <p style={{ fontSize: 13, color: C.sub, textAlign: "center",
          lineHeight: 1.6, marginBottom: 24 }}>
          탈퇴 시 찜 목록, 프로필 정보가 모두 삭제되며<br />복구할 수 없습니다.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onCancel}
            style={{ flex: 1, height: 48, borderRadius: 12,
              border: `1px solid ${C.border}`, background: "#fff",
              fontSize: 14, fontWeight: 600, color: C.sub,
              cursor: "pointer", transition: `background 150ms ${EASE}` }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f8f7ff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}>
            취소
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ flex: 1, height: 48, borderRadius: 12,
              border: "none", background: "#EF4444",
              fontSize: 14, fontWeight: 700, color: "#fff",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: `filter 150ms ${EASE}` }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.filter = "brightness(1.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = "brightness(1)"; }}>
            {loading ? "처리 중…" : "탈퇴하기"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function ProfileClient({
  userId, email, authCreatedAt,
  nickname: initialNickname,
  marketingAgreed: initialMarketing,
  avatarUrl, provider,
}: Props) {
  const router = useRouter();

  const [nickname,        setNickname]        = useState(initialNickname ?? "");
  const [marketingAgreed, setMarketingAgreed] = useState(initialMarketing);
  const [isEditing,       setIsEditing]       = useState(false);
  const [saving,          setSaving]          = useState(false);
  const [logoutLoading,   setLogoutLoading]   = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading,   setDeleteLoading]   = useState(false);
  const [toastMsg,        setToastMsg]        = useState("");
  const [toastVisible,    setToastVisible]    = useState(false);
  const nicknameInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
  };

  // ── 닉네임 + 마케팅 저장 ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (nickname.trim().length === 0) return;
    setSaving(true);
    const supabase = createClientSupabaseClient();
    const { error } = await supabase
      .from("users")
      .update({ nickname: nickname.trim() })
      .eq("id", userId);
    setSaving(false);
    if (error) { showToast("저장에 실패했어요"); return; }
    setIsEditing(false);
    showToast("저장됐어요 ✓");
  };

  // ── 마케팅 토글 (즉시 저장) ──────────────────────────────────────────────────
  const handleMarketingToggle = async () => {
    const next = !marketingAgreed;
    setMarketingAgreed(next);
    const supabase = createClientSupabaseClient();
    await supabase.from("users").update({ marketing_agreed: next }).eq("id", userId);
    showToast(next ? "마케팅 정보 수신에 동의했어요 ✓" : "마케팅 정보 수신을 거부했어요");
  };

  // ── 로그아웃 ─────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    setLogoutLoading(true);
    const supabase = createClientSupabaseClient();
    await supabase.auth.signOut();
    showToast("로그아웃 됐어요");
    setTimeout(() => router.push("/"), 1000);
  };

  // ── 회원 탈퇴 ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleteLoading(true);
    const supabase = createClientSupabaseClient();
    await supabase.from("users").delete().eq("id", userId);
    await supabase.auth.signOut();
    router.push("/");
  };

  // ── 편집 모드 진입 ───────────────────────────────────────────────────────────
  const startEdit = () => {
    setIsEditing(true);
    setTimeout(() => nicknameInputRef.current?.focus(), 0);
  };

  const isDirty = nickname.trim() !== (initialNickname ?? "");

  const providerLabel: Record<string, string> = {
    google: "Google", kakao: "카카오", email: "이메일",
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#f8f7ff" }}>
      <Toast
        visible={toastVisible}
        message={toastMsg}
        duration={2000}
        onClose={() => setToastVisible(false)}
      />

      {showDeleteModal && (
        <DeleteModal
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleteLoading}
        />
      )}

      {/* 헤더 */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        height: 60, background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
        borderBottom: `0.5px solid ${C.border}`,
      }}>
        <div className="max-w-[800px] mx-auto px-6 h-full flex items-center justify-between">
          <button onClick={() => router.push("/")}
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
          <div style={{ width: 64 }} />
        </div>
      </header>

      <main className="max-w-[800px] mx-auto px-6 py-8 space-y-5"
        style={{ boxSizing: "border-box" }}>

        {/* ── 프로필 섹션 ── */}
        <Card>
          <div style={{ padding: "28px 24px", display: "flex", alignItems: "center", gap: 20 }}>
            {/* 아바타 */}
            <div style={{
              width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
              overflow: "hidden",
              background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 16px rgba(27,20,100,0.22)",
              border: "3px solid rgba(255,255,255,0.8)",
            }}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="프로필" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>
                  {(nickname || email || "U")[0].toUpperCase()}
                </span>
              )}
            </div>

            {/* 닉네임 + 이메일 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 20, fontWeight: 800, color: C.text,
                letterSpacing: "-0.02em", marginBottom: 4 }}>
                {nickname || "닉네임 없음"}
              </p>
              {email && (
                <p style={{ fontSize: 13, color: C.sub, marginBottom: 4,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {email}
                </p>
              )}
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontSize: 11, fontWeight: 600, padding: "2px 8px",
                borderRadius: 100, background: "#EDE8FF", color: C.primary,
              }}>
                {providerLabel[provider] ?? provider} 로그인
              </span>
            </div>
          </div>

          {/* 가입일 */}
          <div style={{ borderTop: `1px solid ${C.border}` }}>
            <InfoRow label="가입일">{fmtDate(authCreatedAt)}</InfoRow>
          </div>
        </Card>

        {/* ── 정보 수정 섹션 ── */}
        <Card>
          <div style={{ padding: "20px 20px 0" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.sub,
              letterSpacing: "0.06em", marginBottom: 12 }}>
              내 정보
            </p>
          </div>

          {/* 닉네임 */}
          <div style={{
            padding: "0 20px 16px",
            borderBottom: `1px solid ${C.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "center",
              justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>닉네임</span>
              {!isEditing && (
                <button onClick={startEdit}
                  style={{ fontSize: 12, fontWeight: 600, color: C.secondary,
                    background: "none", border: "none", cursor: "pointer",
                    transition: `opacity 150ms ${EASE}` }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.65"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}>
                  수정
                </button>
              )}
            </div>
            {isEditing ? (
              <input
                ref={nicknameInputRef}
                type="text"
                value={nickname}
                onChange={(e) => { if (e.target.value.length <= 10) setNickname(e.target.value); }}
                maxLength={10}
                style={{
                  width: "100%", height: 44, borderRadius: 10,
                  border: `1.5px solid ${C.secondary}`,
                  padding: "0 12px", fontSize: 14, color: C.text,
                  outline: "none", boxSizing: "border-box",
                  boxShadow: `0 0 0 3px rgba(108,60,225,0.10)`,
                }}
              />
            ) : (
              <p style={{ fontSize: 15, fontWeight: 600, color: C.text }}>
                {nickname || <span style={{ color: C.sub }}>닉네임을 입력해주세요</span>}
              </p>
            )}
            {isEditing && (
              <p style={{ fontSize: 11, color: "#AEAEB2", textAlign: "right", marginTop: 4 }}>
                {nickname.length}/10
              </p>
            )}
          </div>

          {/* 마케팅 수신 동의 */}
          <div style={{
            padding: "14px 20px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
          }}>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                마케팅 수신 동의
              </p>
              <p style={{ fontSize: 12, color: C.sub }}>
                이벤트·대회 알림을 이메일로 받아요
              </p>
            </div>
            {/* 토글 스위치 */}
            <button
              onClick={handleMarketingToggle}
              aria-checked={marketingAgreed}
              role="switch"
              style={{
                width: 48, height: 28, borderRadius: 100, flexShrink: 0,
                border: "none", cursor: "pointer", padding: 3,
                background: marketingAgreed
                  ? `linear-gradient(135deg, ${C.primary}, ${C.secondary})`
                  : "#E5E7EB",
                transition: `background 200ms ${EASE}`,
                display: "flex", alignItems: "center",
                justifyContent: marketingAgreed ? "flex-end" : "flex-start",
              }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%",
                background: "#fff",
                boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                transition: `all 200ms ${EASE}`,
              }} />
            </button>
          </div>
        </Card>

        {/* ── 저장 버튼 ── */}
        {(isEditing || isDirty) && (
          <button
            onClick={handleSave}
            disabled={saving || nickname.trim().length === 0}
            style={{
              width: "100%", height: 52, borderRadius: 14,
              border: "none",
              background: nickname.trim().length === 0
                ? "#E5E7EB"
                : `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
              color: nickname.trim().length === 0 ? "#AEAEB2" : "#fff",
              fontSize: 15, fontWeight: 700,
              cursor: saving || nickname.trim().length === 0 ? "not-allowed" : "pointer",
              opacity: saving ? 0.75 : 1,
              transition: `filter 150ms ${EASE}`,
              boxShadow: nickname.trim().length > 0 ? "0 4px 16px rgba(27,20,100,0.22)" : "none",
            }}
            onMouseEnter={(e) => { if (!saving && nickname.trim().length > 0) e.currentTarget.style.filter = "brightness(1.08)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = "brightness(1)"; }}>
            {saving ? "저장 중…" : "변경사항 저장"}
          </button>
        )}

        {/* ── 내 활동 ── */}
        <Card>
          <div style={{ padding: "16px 20px 0" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.sub,
              letterSpacing: "0.06em", marginBottom: 0 }}>
              내 활동
            </p>
          </div>
          <a href="/profile/applications"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 20px", borderBottom: `1px solid ${C.border}`,
              textDecoration: "none", transition: `background 150ms ${EASE}` }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f8f7ff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>신청한 대회</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M6 3L11 8L6 13" stroke="#AEAEB2"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <a href="/wishlist"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 20px",
              textDecoration: "none", transition: `background 150ms ${EASE}` }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f8f7ff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>찜한 대회</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M6 3L11 8L6 13" stroke="#AEAEB2"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </Card>

        {/* ── 로그아웃 / 탈퇴 ── */}
        <Card>
          {/* 로그아웃 */}
          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            style={{
              width: "100%", padding: "16px 20px", textAlign: "left",
              background: "none", border: "none",
              borderBottom: `1px solid ${C.border}`,
              fontSize: 14, fontWeight: 600, color: C.text,
              cursor: logoutLoading ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              transition: `background 150ms ${EASE}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#f8f7ff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}>
            <span>{logoutLoading ? "로그아웃 중…" : "로그아웃"}</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M6 3H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h3M10 11l3-3-3-3M13 8H6"
                stroke="#AEAEB2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* 회원 탈퇴 */}
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{
              width: "100%", padding: "16px 20px", textAlign: "left",
              background: "none", border: "none",
              fontSize: 14, fontWeight: 600, color: "#EF4444",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              transition: `background 150ms ${EASE}`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#FEF2F2"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}>
            <span>회원 탈퇴</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M8 3v5M8 11v1" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </Card>

        <p style={{ fontSize: 11, color: "#AEAEB2", textAlign: "center", paddingBottom: 16 }}>
          © 2026 Warriors. All rights reserved.
        </p>
      </main>
    </div>
  );
}
