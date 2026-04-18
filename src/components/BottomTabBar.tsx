"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PRIMARY = "#6C3CE1";
const SUB     = "#9CA3AF";

const TABS = [
  {
    label: "홈",
    href: "/",
    exact: true,
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V16H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
          stroke={active ? PRIMARY : SUB} strokeWidth="1.8"
          strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "마이페이지",
    href: "/profile",
    exact: false,
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="8" r="4" stroke={active ? PRIMARY : SUB} strokeWidth="1.8" />
        <path
          d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20"
          stroke={active ? PRIMARY : SUB} strokeWidth="1.8" strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [animatingTab, setAnimatingTab] = useState<string | null>(null);

  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;

    const activeTab = TABS.find(({ href, exact }) =>
      exact ? pathname === href : pathname.startsWith(href)
    );
    if (!activeTab) return;

    setAnimatingTab(activeTab.label);
    const timer = setTimeout(() => setAnimatingTab(null), 350);
    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <>
      <style>{`
        @keyframes tab-bounce {
          0%   { transform: scale(1);    }
          30%  { transform: scale(1.25); }
          60%  { transform: scale(0.95); }
          100% { transform: scale(1);    }
        }
        .tab-bounce { animation: tab-bounce 0.35s ease-in-out; }
      `}</style>
      <nav
        className="md:hidden"
        style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
          background: "#ffffff",
          boxShadow: "0 -4px 20px rgba(0,0,0,0.08)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div style={{ display: "flex", height: 56 }}>
          {TABS.map(({ label, href, exact, icon }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            const isAnimating = animatingTab === label;
            return (
              <Link
                key={label}
                href={href}
                prefetch={true}
                style={{
                  flex: 1, display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 2,
                  textDecoration: "none",
                  color: isActive ? PRIMARY : SUB,
                }}
              >
                <span
                  key={isAnimating ? "bounce" : "idle"}
                  className={isAnimating ? "tab-bounce" : undefined}
                  style={{ display: "flex" }}
                >
                  {icon(isActive)}
                </span>
                <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 400, letterSpacing: "-0.01em" }}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
