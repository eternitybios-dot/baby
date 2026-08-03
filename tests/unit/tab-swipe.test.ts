import { describe, expect, it } from "vitest";
import {
  resistTabSwipeOffset,
  shouldCommitTabSwipe,
} from "@/lib/navigation/tab-swipe";

describe("tab-swipe helpers", () => {
  it("resists drag past the first/last tab", () => {
    expect(resistTabSwipeOffset(100, false, true)).toBeCloseTo(28);
    expect(resistTabSwipeOffset(-100, true, false)).toBeCloseTo(-28);
    expect(resistTabSwipeOffset(100, true, true)).toBe(100);
  });

  it("commits when horizontal distance is enough", () => {
    expect(
      shouldCommitTabSwipe({ dx: -80, dy: 10, width: 390 }),
    ).toBe(true);
    expect(
      shouldCommitTabSwipe({ dx: -20, dy: 10, width: 390 }),
    ).toBe(false);
    expect(
      shouldCommitTabSwipe({ dx: -40, dy: 50, width: 390 }),
    ).toBe(false);
    expect(
      shouldCommitTabSwipe({ dx: -100, dy: 10, width: 390 }),
    ).toBe(true);
  });
});
