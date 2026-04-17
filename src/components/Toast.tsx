"use client";

import { useEffect, useRef } from "react";

const EASE = "cubic-bezier(0.25, 0.46, 0.45, 0.94)";

type ToastProps = {
  /** 표시할 메시지 */
  message: string;
  /** 표시 여부 */
  visible: boolean;
  /** 자동 닫힘 시간 (ms). 기본 1500. 0이면 자동 닫힘 없음. */
  duration?: number;
  /** duration 경과 후 호출되는 콜백 (visible=false로 만들기) */
  onClose: () => void;
  /** 표시 위치. 기본 "top" */
  position?: "top" | "bottom";
};

export default function Toast({
  message,
  visible,
  duration = 1500,
  onClose,
  position = "top",
}: ToastProps) {
  // 최신 onClose를 ref로 보관해 stale closure 방지
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!visible || duration === 0) return;
    const id = setTimeout(() => onCloseRef.current(), duration);
    return () => clearTimeout(id);
  }, [visible, duration]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        ...(position === "top"
          ? { top: 24,    transform: `translateX(-50%) translateY(${visible ? 0 : -12}px)` }
          : { bottom: 100, transform: `translateX(-50%) translateY(${visible ? 0 :  12}px)` }
        ),
        left: "50%",
        opacity: visible ? 1 : 0,
        transition: `opacity 220ms ${EASE}, transform 220ms ${EASE}`,
        background: "#1B1464",
        color: "#ffffff",
        fontSize: 14,
        fontWeight: 600,
        padding: "12px 20px",
        borderRadius: 100,
        pointerEvents: "none",
        zIndex: 9999,
        whiteSpace: "nowrap",
        boxShadow: "0 8px 24px rgba(27,20,100,0.30)",
        letterSpacing: "-0.01em",
      }}
    >
      {message}
    </div>
  );
}
