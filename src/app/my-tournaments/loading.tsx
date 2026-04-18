export default function MyTournamentsLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8f8fb", display: "flex", flexDirection: "column" }}>
      {/* header skeleton */}
      <div style={{ height: 56, background: "#ffffff", borderBottom: "1px solid #f0f0f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 80, height: 20, borderRadius: 6, background: "#e8e8f0", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: "40px 24px" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#e8e8f0", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: 160, height: 20, borderRadius: 6, background: "#e8e8f0", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: 220, height: 16, borderRadius: 6, background: "#e8e8f0", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
