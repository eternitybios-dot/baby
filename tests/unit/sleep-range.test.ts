import { describe, expect, it } from "vitest";
import {
  buildSleepRange,
  defaultSleepTimes,
  parseHm,
} from "@/lib/data/sleep-range";
import { jstYmd } from "@/lib/data/app-state";

describe("睡眠の開始〜終了", () => {
  it("同じ日の昼寝を開始・終了から作る", () => {
    const now = new Date("2026-08-13T16:00:00+09:00");
    const result = buildSleepRange({
      startHm: "13:00",
      endHm: "14:30",
      anchor: now,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.durationMinutes).toBe(90);
    expect(jstYmd(new Date(result.startedAt))).toBe("2026-08-13");
    expect(jstYmd(new Date(result.endedAt))).toBe("2026-08-13");
  });

  it("終了が開始より前なら開始を前日にする", () => {
    const now = new Date("2026-08-13T08:00:00+09:00");
    const result = buildSleepRange({
      startHm: "22:00",
      endHm: "6:30",
      anchor: now,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.durationMinutes).toBe(510);
    expect(jstYmd(new Date(result.startedAt))).toBe("2026-08-12");
    expect(jstYmd(new Date(result.endedAt))).toBe("2026-08-13");
  });

  it("開始と終了が同じならエラーにする", () => {
    const result = buildSleepRange({
      startHm: "12:00",
      endHm: "12:00",
      anchor: new Date("2026-08-13T12:00:00+09:00"),
    });
    expect(result.ok).toBe(false);
  });

  it("時刻文字列を解釈する", () => {
    expect(parseHm("7:05")).toEqual({ hours: 7, minutes: 5 });
    expect(parseHm("07:05")).toEqual({ hours: 7, minutes: 5 });
    expect(parseHm("24:00")).toBeNull();
    expect(parseHm("")).toBeNull();
  });

  it("初期値はいまから1時間前〜いま", () => {
    const now = new Date("2026-08-13T15:20:00+09:00");
    expect(defaultSleepTimes(now)).toEqual({
      startHm: "14:20",
      endHm: "15:20",
    });
  });
});
