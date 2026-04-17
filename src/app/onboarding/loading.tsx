export default function OnboardingLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white">
      <div
        className="w-10 h-10 rounded-full border-[3px] border-gray-100 animate-spin"
        style={{ borderTopColor: "#E24B4A" }}
      />
      <p className="text-sm text-gray-400">불러오는 중...</p>
    </div>
  );
}
