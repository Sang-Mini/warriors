"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// ── 브랜드 토큰 ───────────────────────────────────────────────────────────────
const B = {
  primary:       "#1B1464",
  secondary:     "#6C3CE1",
  accent:        "#00D4FF",
  surface:       "#F8F9FF",
  textPrimary:   "#0D0D2B",
  textSecondary: "#6B7280",
  border:        "#E5E7FF",
} as const;

// ── 타입 ──────────────────────────────────────────────────────────────────────
export type Sport = {
  id: string;
  name: string;
  category: string;
  emoji?: string;
};

// ── 상수 ──────────────────────────────────────────────────────────────────────
const CATEGORY_ORDER = ["격투기", "두뇌스포츠", "e스포츠", "학습"];

const CATEGORY_CONFIG: Record<
  string,
  { icon: string; labelColor: string; labelBg: string }
> = {
  격투기:    { icon: "🥊", labelColor: B.primary,   labelBg: "#ECEEFF" },
  두뇌스포츠: { icon: "♟️", labelColor: B.secondary, labelBg: "#F0E8FF" },
  "e스포츠": { icon: "🎮", labelColor: "#0369A1",   labelBg: "#E0F8FF" },
  학습:      { icon: "📚", labelColor: "#065F46",   labelBg: "#E8FFF4" },
};

// ── W 로고 ────────────────────────────────────────────────────────────────────
function WarriorsLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="34" height="27" viewBox="0 0 38 30" fill="none" aria-hidden>
        <defs>
          <linearGradient id="wGradOnboarding" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={B.primary}   />
            <stop offset="100%" stopColor={B.secondary} />
          </linearGradient>
        </defs>
        <path
          d="M2 4 L10 26 L19 11 L28 26 L36 4"
          stroke="url(#wGradOnboarding)"
          strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
      <div className="flex items-center gap-1.5">
        <span
          className="text-[20px] tracking-[0.2em]"
          style={{ color: B.textPrimary, fontFamily: "var(--font-bebas)", fontWeight: 400 }}
        >
          WARRIORS
        </span>
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden>
          <path
            d="M5 0 L6.1 3.4 L9.8 3.4 L6.9 5.5 L8 8.9 L5 6.8 L2 8.9 L3.1 5.5 L0.2 3.4 L3.9 3.4 Z"
            fill={B.accent}
          />
        </svg>
      </div>
    </div>
  );
}

// ── 에러 상태 ─────────────────────────────────────────────────────────────────
function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: "#F0E8FF" }}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
          <circle cx="11" cy="11" r="10" stroke={B.secondary} strokeWidth="1.8" />
          <path d="M11 7 L11 12" stroke={B.secondary} strokeWidth="2" strokeLinecap="round" />
          <circle cx="11" cy="15.5" r="1.2" fill={B.secondary} />
        </svg>
      </div>
      <p className="text-sm font-semibold" style={{ color: B.textPrimary }}>데이터를 불러오지 못했어요</p>
      <p className="text-xs max-w-[240px] break-all" style={{ color: B.textSecondary }}>{message}</p>
    </div>
  );
}

// ── 빈 데이터 상태 ────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
        style={{ backgroundColor: B.surface }}
      >
        🏅
      </div>
      <p className="text-sm font-semibold" style={{ color: B.textPrimary }}>등록된 종목이 없어요</p>
      <p className="text-xs" style={{ color: B.textSecondary }}>Supabase sports 테이블에 데이터를 추가해 주세요.</p>
    </div>
  );
}

// ── 체크 아이콘 ───────────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <div
      className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
      style={{ backgroundColor: B.primary }}
    >
      <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
        <path
          d="M2.5 5.5 L4.5 7.5 L8.5 3.5"
          stroke="white" strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ── 종목 카드 ─────────────────────────────────────────────────────────────────
function SportCard({
  sport,
  isSelected,
  onToggle,
}: {
  sport: Sport;
  isSelected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onToggle(sport.id)}
      className="relative flex flex-col items-center justify-center gap-2 transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        padding: "16px 12px",
        borderRadius: "16px",
        border: isSelected ? `2px solid ${B.primary}` : `1.5px solid ${B.border}`,
        background: isSelected
          ? "linear-gradient(135deg, #f0edff, #e8e3ff)"
          : "#FFFFFF",
        boxShadow: isSelected
          ? `0 4px 12px rgba(27,20,100,0.15)`
          : "0 1px 4px rgba(0,0,0,0.06)",
      }}
    >
      {isSelected && <CheckIcon />}
      <span style={{ fontSize: "32px", lineHeight: 1 }}>
        {sport.emoji ?? "🏅"}
      </span>
      <span
        className="text-xs font-semibold text-center leading-tight"
        style={{ color: isSelected ? B.primary : B.textPrimary }}
      >
        {sport.name}
      </span>
    </button>
  );
}

// ── 카테고리 헤더 ─────────────────────────────────────────────────────────────
function CategoryHeader({
  category,
  icon,
  labelColor,
  labelBg,
  selectedCount,
}: {
  category: string;
  icon: string;
  labelColor: string;
  labelBg: string;
  selectedCount: number;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-xl leading-none">{icon}</span>
      <span
        className="text-sm font-bold px-3 py-1 rounded-full tracking-wide"
        style={{ color: labelColor, backgroundColor: labelBg }}
      >
        {category}
      </span>
      {selectedCount > 0 && (
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            background: `linear-gradient(135deg, ${B.primary}, ${B.secondary})`,
            color: "#FFFFFF",
          }}
        >
          {selectedCount}
        </span>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function SportSelector({
  sports,
  errorMessage,
}: {
  sports: Sport[];
  errorMessage: string | null;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const router = useRouter();

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleStart = () => {
    if (selected.size === 0) return;
    // TODO: 선택 종목 저장 후 다음 온보딩 단계로 이동
    router.push("/");
  };

  const canStart = selected.size > 0;

  return (
    <div className="flex flex-col min-h-screen bg-white">

      {/* 본문 */}
      <div className="flex-1 pt-10 pb-40">
        <div className="max-w-3xl mx-auto px-6">

          {/* 페이지 타이틀 */}
          <div className="py-6">
            <h1 className="text-2xl font-bold leading-tight" style={{ color: B.textPrimary }}>
              관심 종목을 골라보세요
            </h1>
            <p className="mt-1.5 text-sm" style={{ color: B.textSecondary }}>여러 개 선택할 수 있어요</p>
          </div>

          {/* 종목 목록 */}
          <div className="space-y-8">
            {errorMessage ? (
              <ErrorState message={errorMessage} />
            ) : sports.length === 0 ? (
              <EmptyState />
            ) : (
              CATEGORY_ORDER.map((category) => {
                const items = sports.filter((s) => s.category === category);
                if (items.length === 0) return null;

                const cfg = CATEGORY_CONFIG[category] ?? {
                  icon: "🏅",
                  labelColor: B.textSecondary,
                  labelBg: "#F9FAFB",
                };

                const selectedInCategory = items.filter((s) => selected.has(s.id)).length;

                return (
                  <section key={category}>
                    <CategoryHeader
                      category={category}
                      icon={cfg.icon}
                      labelColor={cfg.labelColor}
                      labelBg={cfg.labelBg}
                      selectedCount={selectedInCategory}
                    />

                    {/* 3열 그리드 (모바일 2열) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {items.map((sport) => (
                        <SportCard
                          key={sport.id}
                          sport={sport}
                          isSelected={selected.has(sport.id)}
                          onToggle={toggle}
                        />
                      ))}
                    </div>
                  </section>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 하단 CTA */}
      <div
        className="fixed bottom-0 left-0 right-0 px-6 pb-10 pt-8"
        style={{ background: "linear-gradient(to top, #ffffff 65%, rgba(255,255,255,0))" }}
      >
        <div className="max-w-3xl mx-auto">
          {canStart && (
            <p className="text-center text-xs mb-3 font-medium" style={{ color: B.textSecondary }}>
              {selected.size}개 선택됨
            </p>
          )}
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="w-full h-14 rounded-2xl text-[15px] font-bold tracking-wide transition-all duration-200"
            style={
              canStart
                ? {
                    background: `linear-gradient(135deg, ${B.primary}, ${B.secondary})`,
                    color: "#FFFFFF",
                    boxShadow: `0 6px 20px rgba(27,20,100,0.3)`,
                  }
                : {
                    backgroundColor: "#F3F4F6",
                    color: "#D1D5DB",
                    cursor: "not-allowed",
                  }
            }
          >
            {canStart ? `시작하기  ·  ${selected.size}개 선택됨` : "종목을 선택해 주세요"}
          </button>
        </div>
      </div>
    </div>
  );
}
