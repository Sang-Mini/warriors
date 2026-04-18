export default function ProfileLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "#f8f8fb", display: "flex", flexDirection: "column" }}>
      {/* header skeleton */}
      <div style={{ height: 56, background: "#ffffff", borderBottom: "1px solid #f0f0f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 80, height: 20, borderRadius: 6, background: "#e8e8f0", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      {/* profile section skeleton */}
      <div style={{ padding: "32px 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, borderBottom: "1px solid #f0f0f5", background: "#ffffff" }}>
        <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#e8e8f0", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: 120, height: 20, borderRadius: 6, background: "#e8e8f0", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: 160, height: 16, borderRadius: 6, background: "#e8e8f0", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      {/* menu rows skeleton */}
      <div style={{ padding: "8px 0" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: 52, margin: "4px 16px", borderRadius: 10, background: "#e8e8f0", animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
