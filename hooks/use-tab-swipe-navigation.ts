"use client";

import { useCallback, useRef, type PointerEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAdjacentMainTab } from "@/lib/navigation/main-tabs";

const MIN_DISTANCE_PX = 64;
const MAX_DURATION_MS = 700;
const HORIZONTAL_RATIO = 1.35;
const NAV_LOCK_MS = 450;

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "input, textarea, select, option, button, a, [role='button'], [role='slider'], [contenteditable='true'], [data-no-tab-swipe]",
    ),
  );
}

/**
 * メインタブ（ホーム↔カレンダー↔グラフ↔設定）を横スワイプで切り替える。
 * 縦スクロールを優先し、シート表示中は呼び出し側で enabled=false にする。
 */
export function useTabSwipeNavigation(enabled: boolean) {
  const router = useRouter();
  const pathname = usePathname();
  const startRef = useRef<{
    x: number;
    y: number;
    t: number;
    pointerId: number;
  } | null>(null);
  const lockedUntilRef = useRef(0);

  const clearStart = useCallback(() => {
    startRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!enabled) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (isInteractiveTarget(event.target)) return;

      startRef.current = {
        x: event.clientX,
        y: event.clientY,
        t: Date.now(),
        pointerId: event.pointerId,
      };
    },
    [enabled],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const start = startRef.current;
      startRef.current = null;
      if (!enabled || !start) return;
      if (start.pointerId !== event.pointerId) return;
      if (Date.now() < lockedUntilRef.current) return;

      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const duration = Date.now() - start.t;

      if (duration > MAX_DURATION_MS) return;
      if (absX < MIN_DISTANCE_PX) return;
      if (absX < absY * HORIZONTAL_RATIO) return;

      // 左スワイプ → 次タブ / 右スワイプ → 前タブ
      const direction = dx < 0 ? "next" : "prev";
      const target = getAdjacentMainTab(pathname, direction);
      if (!target) return;

      lockedUntilRef.current = Date.now() + NAV_LOCK_MS;
      router.push(target);
    },
    [enabled, pathname, router],
  );

  const onPointerCancel = useCallback(() => {
    clearStart();
  }, [clearStart]);

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel,
  };
}
