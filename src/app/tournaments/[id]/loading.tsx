export default function TournamentDetailLoading() {
  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 스켈레톤 */}
      <div style={{
        height: 56, background: "#fff",
        borderBottom: "0.5px solid rgba(108,60,225,0.10)",
        display: "flex", alignItems: "center", padding: "0 24px", gap: 16,
      }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f0edff" }} />
        <div style={{ flex: 1, height: 16, borderRadius: 8, background: "#f0edff", maxWidth: 200 }} />
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 20px" }}>
        {/* 포스터 스켈레톤 */}
        <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
          <div style={{ width: "100%", aspectRatio: "16/7", background: "#f0edff" }}
            className="skeleton" />
        </div>

        {/* 종목 배지 + 제목 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
          <div style={{ width: 72, height: 24, borderRadius: 100, background: "#f0edff" }} />
          <div style={{ width: "85%", height: 28, borderRadius: 8, background: "#f0edff" }} />
          <div style={{ width: "60%", height: 28, borderRadius: 8, background: "#f0edff" }} />
        </div>

        {/* D-day 카드 2개 */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28 }}>
          {[0, 1].map((i) => (
            <div key={i} style={{
              flex: 1, height: 80, borderRadius: 12, background: "#f0edff",
            }} />
          ))}
        </div>

        {/* 정보 리스트 스켈레톤 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
          {[100, 75, 85, 60].map((w, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#f0edff", flexShrink: 0 }} />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ width: 40, height: 10, borderRadius: 4, background: "#f0edff" }} />
                <div style={{ width: `${w}%`, height: 14, borderRadius: 4, background: "#f0edff" }} />
              </div>
            </div>
          ))}
        </div>

        {/* 신청 버튼 스켈레톤 */}
        <div style={{ height: 52, borderRadius: 14, background: "#f0edff" }} />
      </div>

      <style>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.5; }
        }
        .skeleton, [style*="background: #f0edff"] {
          animation: skeleton-pulse 1.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
