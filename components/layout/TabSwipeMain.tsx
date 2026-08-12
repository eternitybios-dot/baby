"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { getAdjacentMainTab } from "@/lib/navigation/main-tabs";
import {
  resistTabSwipeOffset,
  shouldCommitTabSwipe,
} from "@/lib/navigation/tab-swipe";
import { cn } from "@/lib/utils";

const AXIS_LOCK_PX = 10;
const ANIM_MS = 320;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const NAV_LOCK_MS = ANIM_MS + 120;

type AxisLock = "undecided" | "horizontal" | "vertical";

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      "input, textarea, select, option, button, a, [role='button'], [role='slider'], [contenteditable='true'], [data-no-tab-swipe]",
    ),
  );
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

type TabSwipeMainProps = {
  children: ReactNode;
  enabled: boolean;
  className?: string;
};

/**
 * メインタブを指に追従する横スライドで切り替える。
 * 確定後は exit → ルート遷移 → enter の流れでアニメーションする。
 */
export function TabSwipeMain({
  children,
  enabled,
  className,
}: TabSwipeMainProps) {
  const router = useRouter();
  const pathname = usePathname();
  const paneRef = useRef<HTMLElement | null>(null);
  const startRef = useRef<{
    x: number;
    y: number;
    pointerId: number;
  } | null>(null);
  const axisRef = useRef<AxisLock>("undecided");
  const offsetRef = useRef(0);
  const animatingRef = useRef(false);
  const lockedUntilRef = useRef(0);
  const pendingEnterRef = useRef<"prev" | "next" | null>(null);
  const pathnameRef = useRef(pathname);

  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [transition, setTransition] = useState<string>("none");

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const setOffset = useCallback((value: number) => {
    offsetRef.current = value;
    setOffsetX(value);
  }, []);

  const settleHome = useCallback(async () => {
    setTransition(`transform ${ANIM_MS}ms ${EASE}`);
    setOffset(0);
    setDragging(false);
    await wait(ANIM_MS);
    setTransition("none");
  }, [setOffset]);

  const navigateWithSlide = useCallback(
    async (direction: "prev" | "next", target: string) => {
      if (animatingRef.current) return;
      animatingRef.current = true;
      lockedUntilRef.current = Date.now() + NAV_LOCK_MS + ANIM_MS;

      const width = paneRef.current?.offsetWidth ?? window.innerWidth;
      const reduced = prefersReducedMotion();

      if (reduced) {
        router.push(target);
        setOffset(0);
        setTransition("none");
        setDragging(false);
        animatingRef.current = false;
        return;
      }

      const enterX = direction === "next" ? width : -width;
      const slideTransition = `transform ${ANIM_MS}ms ${EASE}`;

      pendingEnterRef.current = direction;
      setDragging(false);
      router.push(target);
      setTransition("none");
      setOffset(enterX);

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => resolve());
        });
      });
      setTransition(slideTransition);
      setOffset(0);
      await wait(ANIM_MS);
      setTransition("none");
      pendingEnterRef.current = null;
      animatingRef.current = false;
    },
    [router, setOffset],
  );

  // ボトムナビ等の通常遷移でも、直前スワイプの enter 待ちを壊さない
  useEffect(() => {
    if (pendingEnterRef.current) return;
    if (animatingRef.current) return;
    setTransition("none");
    setOffset(0);
  }, [pathname, setOffset]);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (!enabled || animatingRef.current) return;
      if (Date.now() < lockedUntilRef.current) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (isInteractiveTarget(event.target)) return;

      startRef.current = {
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId,
      };
      axisRef.current = "undecided";
      setTransition("none");
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [enabled],
  );

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      const start = startRef.current;
      if (!start || start.pointerId !== event.pointerId) return;
      if (!enabled || animatingRef.current) return;

      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;

      if (axisRef.current === "undecided") {
        if (Math.abs(dx) < AXIS_LOCK_PX && Math.abs(dy) < AXIS_LOCK_PX) {
          return;
        }
        axisRef.current =
          Math.abs(dx) >= Math.abs(dy) * 1.1 ? "horizontal" : "vertical";
        if (axisRef.current === "vertical") {
          startRef.current = null;
          setDragging(false);
          setOffset(0);
          return;
        }
        setDragging(true);
      }

      if (axisRef.current !== "horizontal") return;

      const canPrev = getAdjacentMainTab(pathname, "prev") != null;
      const canNext = getAdjacentMainTab(pathname, "next") != null;
      setOffset(resistTabSwipeOffset(dx, canPrev, canNext));
      event.preventDefault();
    },
    [enabled, pathname, setOffset],
  );

  const finishGesture = useCallback(
    async (event: PointerEvent<HTMLElement>) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start || start.pointerId !== event.pointerId) return;

      if (axisRef.current !== "horizontal") {
        axisRef.current = "undecided";
        return;
      }
      axisRef.current = "undecided";

      const dx = offsetRef.current;
      const dy = event.clientY - start.y;
      const width = paneRef.current?.offsetWidth ?? window.innerWidth;

      if (
        !shouldCommitTabSwipe({ dx, dy, width }) ||
        !enabled ||
        animatingRef.current
      ) {
        await settleHome();
        return;
      }

      const direction = dx < 0 ? "next" : "prev";
      const target = getAdjacentMainTab(pathname, direction);
      if (!target) {
        await settleHome();
        return;
      }

      await navigateWithSlide(direction, target);
    },
    [enabled, navigateWithSlide, pathname, settleHome],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      void finishGesture(event);
    },
    [finishGesture],
  );

  const onPointerCancel = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      startRef.current = null;
      axisRef.current = "undecided";
      if (!animatingRef.current) {
        void settleHome();
      }
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    },
    [settleHome],
  );

  const style: CSSProperties = {
    transform: `translate3d(${offsetX}px, 0, 0)`,
    transition,
    willChange: dragging || transition !== "none" ? "transform" : undefined,
  };

  return (
    <main
      ref={paneRef}
      className={cn(
        "relative touch-pan-y overscroll-x-none",
        dragging && "select-none",
        className,
      )}
      style={style}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {children}
    </main>
  );
}
