"use client";

import { useState, useTransition, useRef } from "react";
import type { Sport } from "@/app/onboarding/SportSelector";
import type { AdminTournament } from "./page";
import { createTournament, updateTournament, deleteTournament, uploadPoster, type TournamentInput } from "./actions";

// ── 디자인 토큰 ───────────────────────────────────────────────────────────────
const C = {
  primary:   "#1B1464",
  secondary: "#6C3CE1",
  accent:    "#00D4FF",
  surface:   "#F8F9FF",
  text:      "#0D0D2B",
  sub:       "#6B7280",
  border:    "#E5E7FF",
} as const;

const EASE = "cubic-bezier(0.4,0,0.2,1)";

const REGIONS = ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주", "온라인", "기타"];

const EMPTY_FORM: TournamentInput = {
  title: "",
  sport_id: "",
  start_date: "",
  registration_start: null,
  deadline: null,
  region: "",
  location: null,
  fee: null,
  fee_varies: false,
  apply_url: null,
  is_beginner_friendly: false,
  description: null,
  poster_url: null,
  tags: null,
};

// ── 입력 필드 ─────────────────────────────────────────────────────────────────
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
        {label}{required && <span style={{ color: "#EF4444", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  height: 40, padding: "0 12px", borderRadius: 10,
  border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text,
  background: "#fff", outline: "none", width: "100%",
  transition: `border-color 150ms ${EASE}`,
};

const textareaStyle: React.CSSProperties = {
  padding: "10px 12px", borderRadius: 10,
  border: `1.5px solid ${C.border}`, fontSize: 14, color: C.text,
  background: "#fff", outline: "none", width: "100%", resize: "vertical",
  minHeight: 100, lineHeight: 1.6,
  transition: `border-color 150ms ${EASE}`,
};

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
export default function AdminClient({
  sports,
  initialTournaments,
}: {
  sports: Sport[];
  initialTournaments: AdminTournament[];
}) {
  const [tournaments, setTournaments] = useState<AdminTournament[]>(initialTournaments);
  const [form, setForm] = useState<TournamentInput>(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = editId !== null;

  function setField<K extends keyof TournamentInput>(key: K, value: TournamentInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addTag(raw: string) {
    const items = raw.split(",").map((s) => s.trim().replace(/^#+/, "")).filter(Boolean);
    if (items.length === 0) return;
    const existing = form.tags ?? [];
    const merged = [...new Set([...existing, ...items])];
    setField("tags", merged.length > 0 ? merged : null);
    setTagInput("");
  }

  function removeTag(tag: string) {
    const next = (form.tags ?? []).filter((t) => t !== tag);
    setField("tags", next.length > 0 ? next : null);
  }

  function handlePosterChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("이미지는 5MB 이하만 업로드 가능해요."); return; }
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) { setError("jpg, png, webp, svg 형식만 허용해요."); return; }
    setError(null);
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("이미지는 5MB 이하만 업로드 가능해요."); return; }
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowed.includes(file.type)) { setError("jpg, png, webp, svg 형식만 허용해요."); return; }
    setError(null);
    setPosterFile(file);
    setPosterPreview(URL.createObjectURL(file));
  }

  function handleEdit(t: AdminTournament) {
    setEditId(t.id);
    setForm({
      title: t.title,
      sport_id: t.sport_id,
      start_date: t.start_date,
      registration_start: t.registration_start,
      deadline: t.deadline,
      region: t.region,
      location: t.location,
      fee: t.fee,
      fee_varies: (t as AdminTournament & { fee_varies?: boolean }).fee_varies ?? false,
      apply_url: t.apply_url,
      is_beginner_friendly: t.is_beginner_friendly,
      description: t.description,
      poster_url: (t as AdminTournament & { poster_url?: string | null }).poster_url ?? null,
      tags: t.tags ?? null,
    });
    setTagInput("");
    setPosterFile(null);
    setPosterPreview((t as AdminTournament & { poster_url?: string | null }).poster_url ?? null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancel() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setPosterFile(null);
    setPosterPreview(null);
    setTagInput("");
    setError(null);
  }

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 2000);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.sport_id || !form.start_date || !form.region) {
      setError("대회명, 종목, 날짜, 지역은 필수입니다.");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        let finalForm = { ...form };

        // 새 파일이 있으면 Storage 업로드
        if (posterFile) {
          const fd = new FormData();
          fd.append("file", posterFile);
          const url = await uploadPoster(fd);
          finalForm = { ...finalForm, poster_url: url };
        }

        if (isEditing) {
          await updateTournament(editId, finalForm);
          setTournaments((prev) =>
            prev.map((t) => t.id === editId
              ? { ...t, ...form, sports: sports.find(s => s.id === form.sport_id) ? { name: sports.find(s => s.id === form.sport_id)!.name, emoji: sports.find(s => s.id === form.sport_id)!.emoji ?? null } : t.sports }
              : t
            )
          );
          showSuccess("대회가 수정됐어요");
          handleCancel();
        } else {
          await createTournament(finalForm);
          showSuccess("대회가 등록됐어요 🎉");
          setForm(EMPTY_FORM);
          setPosterFile(null);
          setPosterPreview(null);
          setTagInput("");
          // 목록 갱신 (새로 추가된 항목은 id 모르니 간단히 reload 유도)
          window.location.reload();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "오류가 발생했어요");
      }
    });
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" 대회를 삭제할까요?`)) return;
    startTransition(async () => {
      try {
        await deleteTournament(id);
        setTournaments((prev) => prev.filter((t) => t.id !== id));
        showSuccess("삭제됐어요");
      } catch (err) {
        setError(err instanceof Error ? err.message : "삭제 중 오류가 발생했어요");
      }
    });
  }

  return (
    <div style={{ minHeight: "100vh", background: C.surface }}>
      {/* 헤더 */}
      <header style={{
        background: "#fff", borderBottom: `0.5px solid ${C.border}`,
        position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{
          maxWidth: 900, margin: "0 auto", padding: "0 24px",
          height: 60, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20, fontFamily: "var(--font-bebas)", color: C.primary, letterSpacing: "0.15em" }}>
              WARRIORS
            </span>
            <span style={{
              fontSize: 11, fontWeight: 700, color: C.secondary,
              background: "#f0edff", borderRadius: 6, padding: "2px 8px", letterSpacing: "0.04em",
            }}>
              ADMIN
            </span>
          </div>
          <a href="/" style={{ fontSize: 13, color: C.sub, textDecoration: "none" }}>← 홈으로</a>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: 32 }}>

        {/* 피드백 토스트 */}
        {success && (
          <div style={{
            position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)",
            background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600,
            padding: "12px 24px", borderRadius: 100,
            boxShadow: "0 8px 24px rgba(27,20,100,0.3)", zIndex: 9999, whiteSpace: "nowrap",
          }}>
            {success}
          </div>
        )}

        {/* 대회 등록 / 수정 폼 */}
        <section style={{
          background: "#fff", borderRadius: 20,
          border: `1px solid ${C.border}`,
          boxShadow: "0 2px 12px rgba(108,60,225,0.06)",
          padding: "28px 28px",
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 24 }}>
            {isEditing ? "대회 수정" : "새 대회 등록"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

              {/* 대회명 */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="대회명" required>
                  <input
                    style={inputStyle}
                    value={form.title}
                    onChange={(e) => setField("title", e.target.value)}
                    placeholder="예: 2026 전국 격투기 선수권대회"
                  />
                </Field>
              </div>

              {/* 종목 */}
              <Field label="종목" required>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.sport_id}
                  onChange={(e) => setField("sport_id", e.target.value)}
                >
                  <option value="">종목 선택</option>
                  {sports.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.emoji ? `${s.emoji} ` : ""}{s.name}
                    </option>
                  ))}
                </select>
              </Field>

              {/* 지역 */}
              <Field label="지역" required>
                <select
                  style={{ ...inputStyle, cursor: "pointer" }}
                  value={form.region}
                  onChange={(e) => setField("region", e.target.value)}
                >
                  <option value="">지역 선택</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </Field>

              {/* 대회 날짜 */}
              <Field label="대회 날짜" required>
                <input
                  type="date" style={inputStyle}
                  value={form.start_date}
                  onChange={(e) => setField("start_date", e.target.value)}
                />
              </Field>

              {/* 접수 시작일 */}
              <Field label="접수 시작일">
                <input
                  type="date" style={inputStyle}
                  value={form.registration_start ?? ""}
                  onChange={(e) => setField("registration_start", e.target.value || null)}
                />
              </Field>

              {/* 접수 마감일 */}
              <Field label="접수 마감일">
                <input
                  type="date" style={inputStyle}
                  value={form.deadline ?? ""}
                  onChange={(e) => setField("deadline", e.target.value || null)}
                />
              </Field>

              {/* 장소 */}
              <Field label="장소">
                <input
                  style={inputStyle}
                  value={form.location ?? ""}
                  onChange={(e) => setField("location", e.target.value || null)}
                  placeholder="예: 서울올림픽공원 체조경기장"
                />
              </Field>

              {/* 참가비 */}
              <Field label="참가비 (0 = 무료)">
                <input
                  type="number" min="0" style={inputStyle}
                  value={form.fee ?? ""}
                  onChange={(e) => setField("fee", e.target.value === "" ? null : Number(e.target.value))}
                  placeholder="0"
                />
                <label style={{ display: "inline-flex", alignItems: "center", gap: 7,
                  fontSize: 13, color: C.sub, cursor: "pointer", marginTop: 4 }}>
                  <input
                    type="checkbox"
                    checked={form.fee_varies ?? false}
                    onChange={(e) => setField("fee_varies", e.target.checked)}
                  />
                  코스별 참가비 다름
                </label>
              </Field>

              {/* 신청 링크 */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="신청 링크 (URL)">
                  <input
                    type="url" style={inputStyle}
                    value={form.apply_url ?? ""}
                    onChange={(e) => setField("apply_url", e.target.value || null)}
                    placeholder="https://..."
                  />
                </Field>
              </div>

              {/* 초보자 환영 토글 */}
              <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setField("is_beginner_friendly", !form.is_beginner_friendly)}
                  style={{
                    width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                    background: form.is_beginner_friendly ? C.secondary : "#D1D5DB",
                    position: "relative", transition: `background 200ms ${EASE}`, flexShrink: 0,
                  }}
                >
                  <span style={{
                    position: "absolute", top: 2, width: 20, height: 20,
                    borderRadius: "50%", background: "#fff",
                    left: form.is_beginner_friendly ? 22 : 2,
                    transition: `left 200ms ${EASE}`,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  }} />
                </button>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>초보자 환영</span>
              </div>

              {/* 포스터 이미지 */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="포스터 이미지">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    style={{
                      borderRadius: 12,
                      border: `1.5px dashed ${isDragOver ? C.secondary : C.border}`,
                      background: isDragOver ? "#f0edff" : C.surface,
                      cursor: "pointer", overflow: "hidden", position: "relative",
                      minHeight: posterPreview ? undefined : 100,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: `border-color 150ms ${EASE}, background 150ms ${EASE}`,
                    }}
                    onMouseEnter={(e) => { if (!isDragOver) e.currentTarget.style.borderColor = C.secondary; }}
                    onMouseLeave={(e) => { if (!isDragOver) e.currentTarget.style.borderColor = C.border; }}
                  >
                    {posterPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={posterPreview}
                        alt="포스터 미리보기"
                        style={{ width: "100%", maxHeight: 280, objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <div style={{ textAlign: "center", padding: "24px 16px" }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 8px" }} aria-hidden>
                          <path d="M12 4V14M12 4L9 7M12 4L15 7" stroke={isDragOver ? C.secondary : C.sub} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M4 17V19C4 19.55 4.45 20 5 20H19C19.55 20 20 19.55 20 19V17" stroke={isDragOver ? C.secondary : C.sub} strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        <p style={{ fontSize: 13, color: isDragOver ? C.secondary : C.sub, margin: 0, fontWeight: isDragOver ? 600 : 400 }}>
                          {isDragOver ? "여기에 놓으세요" : "이미지를 여기에 드래그하거나 클릭해서 업로드"}
                        </p>
                        <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>권장 크기: 680 x 680px (1:1 정사각형) · JPG, PNG, WEBP, SVG · 최대 5MB</p>
                      </div>
                    )}
                  </div>
                  {posterPreview && (
                    <button
                      type="button"
                      onClick={() => { setPosterFile(null); setPosterPreview(null); setField("poster_url", null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      style={{
                        marginTop: 6, fontSize: 12, color: "#EF4444", background: "none",
                        border: "none", cursor: "pointer", padding: 0, fontWeight: 500,
                      }}
                    >
                      이미지 제거
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/svg+xml"
                    style={{ display: "none" }}
                    onChange={handlePosterChange}
                  />
                </Field>
              </div>

              {/* 태그 */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="태그">
                  <div style={{
                    borderRadius: 10, border: `1.5px solid ${C.border}`,
                    background: "#fff", padding: "8px 12px",
                    transition: `border-color 150ms ${EASE}`,
                  }}
                    onFocusCapture={(e) => { e.currentTarget.style.borderColor = C.secondary; }}
                    onBlurCapture={(e) => { e.currentTarget.style.borderColor = C.border; }}
                  >
                    {(form.tags?.length ?? 0) > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                        {(form.tags ?? []).map((tag) => (
                          <span key={tag} style={{
                            display: "inline-flex", alignItems: "center", gap: 4,
                            fontSize: 12, padding: "3px 10px", borderRadius: 100,
                            background: "#EDE8FF", color: C.secondary, fontWeight: 600,
                          }}>
                            #{tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              style={{
                                background: "none", border: "none", cursor: "pointer",
                                padding: 0, lineHeight: 1, color: C.secondary,
                                fontSize: 15, display: "flex", alignItems: "center",
                              }}
                            >×</button>
                          </span>
                        ))}
                      </div>
                    )}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val.endsWith(",")) { addTag(val.slice(0, -1)); }
                        else { setTagInput(val); }
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter" && !e.nativeEvent.isComposing) { e.preventDefault(); addTag(tagInput); } }}
                      placeholder={(form.tags?.length ?? 0) === 0 ? "예: 50K, 하프, 노기 (Enter로 추가)" : "태그 추가..."}
                      style={{
                        border: "none", outline: "none", fontSize: 14,
                        color: C.text, width: "100%", background: "transparent",
                      }}
                    />
                  </div>
                  <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                    Enter 또는 쉼표(,)로 태그를 추가하세요
                  </p>
                </Field>
              </div>

              {/* 대회 설명 */}
              <div style={{ gridColumn: "1 / -1" }}>
                <Field label="대회 설명">
                  <textarea
                    style={textareaStyle}
                    value={form.description ?? ""}
                    onChange={(e) => setField("description", e.target.value || null)}
                    placeholder="대회에 대한 상세 설명을 입력하세요"
                  />
                </Field>
              </div>
            </div>

            {error && (
              <p style={{ marginTop: 16, fontSize: 13, color: "#EF4444", fontWeight: 500 }}>
                {error}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button
                type="submit"
                disabled={isPending}
                style={{
                  height: 44, padding: "0 28px", borderRadius: 12, border: "none",
                  background: `linear-gradient(135deg, ${C.primary}, ${C.secondary})`,
                  color: "#fff", fontSize: 14, fontWeight: 700, cursor: isPending ? "wait" : "pointer",
                  opacity: isPending ? 0.7 : 1, transition: `opacity 150ms ${EASE}`,
                }}
              >
                {isPending ? "처리 중…" : isEditing ? "수정 완료" : "대회 등록"}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleCancel}
                  style={{
                    height: 44, padding: "0 20px", borderRadius: 12,
                    border: `1.5px solid ${C.border}`, background: "#fff",
                    color: C.sub, fontSize: 14, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  취소
                </button>
              )}
            </div>
          </form>
        </section>

        {/* 대회 목록 */}
        <section style={{
          background: "#fff", borderRadius: 20,
          border: `1px solid ${C.border}`,
          boxShadow: "0 2px 12px rgba(108,60,225,0.06)",
          padding: "28px 28px",
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 20 }}>
            등록된 대회 <span style={{ fontSize: 14, color: C.sub, fontWeight: 500 }}>({tournaments.length})</span>
          </h2>

          {tournaments.length === 0 ? (
            <p style={{ fontSize: 14, color: C.sub, textAlign: "center", padding: "32px 0" }}>
              등록된 대회가 없어요
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {tournaments.map((t, i) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "14px 0",
                    borderTop: i === 0 ? "none" : `1px solid ${C.border}`,
                  }}
                >
                  {/* 종목 이모지 */}
                  <span style={{
                    width: 36, height: 36, borderRadius: 10, background: C.surface,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, flexShrink: 0,
                  }}>
                    {t.sports?.emoji ?? "🏅"}
                  </span>

                  {/* 정보 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: C.text,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.title}
                    </p>
                    <p style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                      {t.region} · {t.start_date} · {t.sports?.name ?? "-"}
                    </p>
                  </div>

                  {/* 버튼 */}
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => handleEdit(t)}
                      style={{
                        height: 32, padding: "0 14px", borderRadius: 8,
                        border: `1.5px solid ${C.border}`, background: "#fff",
                        color: C.secondary, fontSize: 12, fontWeight: 600, cursor: "pointer",
                        transition: `background 120ms ${EASE}`,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#f0edff"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(t.id, t.title)}
                      disabled={isPending}
                      style={{
                        height: 32, padding: "0 14px", borderRadius: 8,
                        border: "1.5px solid #FECACA", background: "#fff",
                        color: "#EF4444", fontSize: 12, fontWeight: 600, cursor: "pointer",
                        transition: `background 120ms ${EASE}`,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#FFF5F5"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
