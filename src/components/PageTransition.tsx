"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useRef } from "react";

// 페이지 depth 순서 (앞 → 뒤 이동 시 슬라이드 방향 결정)
const PAGE_ORDER: Record<string, number> = {
  "/":               0,
  "/my-tournaments": 1,
  "/wishlist":       1,
  "/profile":        2,
};

function getDepth(path: string): number {
  // 정확히 일치하는 키 먼저
  if (PAGE_ORDER[path] !== undefined) return PAGE_ORDER[path];
  // prefix 매칭 (예: /tournaments/xxx → depth 3)
  if (path.startsWith("/tournaments/")) return 3;
  return 1;
}

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevDepth = useRef(getDepth(pathname));
  const currentDepth = getDepth(pathname);

  const direction = currentDepth >= prevDepth.current ? 1 : -1;
  prevDepth.current = currentDepth;

  const variants = {
    initial: { x: `${direction * 100}%`, opacity: 0 },
    animate: { x: "0%",                  opacity: 1 },
    exit:    { x: `${-direction * 30}%`, opacity: 0 },
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ width: "100%", minHeight: "100%" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
