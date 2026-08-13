import { describe, expect, it } from "vitest";
import {
  addJstDays,
  computeWeekMetrics,
  dayCountsByYmd,
  groupRecordsByJstHour,
  jstHour,
  jstWeekYmds,
  jstWeekdaySunday0,
  recordMatchesCategory,
  sleepOccupiedHours,
  sleepSpansOnJstDay,
  startOfJstWeekSunday,
  weekGridMarks,
} from "@/lib/data/day-log";
import { jstYmd } from "@/lib/data/app-state";
import { formatLogDate, formatWeekRange } from "@/lib/format";
import type { CareRecord } from "@/types/domain";

function makeRecord(
  partial: Partial<CareRecord> &
    Pick<CareRecord, "id" | "recordType" | "recordedAt" | "detail">,
): CareRecord {
  return {
    familyId: "fam-1",
    babyId: "baby-1",
    userId: "user-1",
    startedAt: null,
    endedAt: null,
    note: null,
    recorder: { id: "user-1", displayName: "ママ", avatarUrl: null },
    ...partial,
  };
}

describe("JST 週の境界（日曜始まり）", () => {
  it("水曜日ならその週の日曜が週の始まりになる", () => {
    const wed = new Date("2026-08-12T15:00:00+09:00");
    expect(jstWeekdaySunday0(wed)).toBe(3);
    expect(jstYmd(startOfJstWeekSunday(wed))).toBe("2026-08-09");
    expect(jstWeekYmds(wed)).toEqual([
      "2026-08-09",
      "2026-08-10",
      "2026-08-11",
      "2026-08-12",
      "2026-08-13",
      "2026-08-14",
      "2026-08-15",
    ]);
    expect(formatLogDate(wed)).toBe("2026/8/12(水)");
    expect(formatWeekRange("2026-08-09", "2026-08-15")).toBe(
      "2026/8/9〜2026/8/15",
    );
  });

  it("日曜そのものは週の先頭になる", () => {
    const sun = new Date("2026-08-09T00:30:00+09:00");
    expect(jstYmd(startOfJstWeekSunday(sun))).toBe("2026-08-09");
  });

  it("日付を日数分ずらす", () => {
    expect(addJstDays("2026-08-12", -1)).toBe("2026-08-11");
    expect(addJstDays("2026-08-15", 1)).toBe("2026-08-16");
  });
});

describe("時刻バケットとカテゴリ", () => {
  it("JST の時・分を取り出す", () => {
    expect(jstHour(new Date("2026-08-12T12:00:00+09:00"))).toBe(12);
    expect(jstHour(new Date("2026-08-12T00:10:00+09:00"))).toBe(0);
    expect(jstHour(new Date("2026-08-11T15:00:00Z"))).toBe(0);
  });

  it("食事・排泄などのカテゴリで絞り込む", () => {
    const formula = makeRecord({
      id: "f",
      recordType: "formula",
      recordedAt: "2026-08-12T12:00:00+09:00",
      detail: { type: "formula", formula: { amountMl: 70 } },
    });
    const diaper = makeRecord({
      id: "d",
      recordType: "diaper",
      recordedAt: "2026-08-12T13:00:00+09:00",
      detail: { type: "diaper", diaper: { kind: "urine" } },
    });
    expect(recordMatchesCategory(formula, "feeding")).toBe(true);
    expect(recordMatchesCategory(formula, "diaper")).toBe(false);
    expect(recordMatchesCategory(diaper, "diaper")).toBe(true);
    expect(recordMatchesCategory(diaper, "all")).toBe(true);
  });

  it("週グリッドの点を日付と時間に載せる", () => {
    const records: CareRecord[] = [
      makeRecord({
        id: "1",
        recordType: "formula",
        recordedAt: "2026-08-12T12:10:00+09:00",
        detail: { type: "formula", formula: { amountMl: 70 } },
      }),
      makeRecord({
        id: "2",
        recordType: "diaper",
        recordedAt: "2026-08-12T08:00:00+09:00",
        detail: { type: "diaper", diaper: { kind: "urine" } },
      }),
    ];
    const week = jstWeekYmds(new Date("2026-08-12T12:00:00+09:00"));
    const marks = weekGridMarks(records, week, "feeding");
    expect(marks).toHaveLength(1);
    expect(marks[0]).toMatchObject({
      ymd: "2026-08-12",
      hour: 12,
      minute: 10,
      recordId: "1",
    });
    expect(dayCountsByYmd(records, week, "all")["2026-08-12"]).toBe(2);
    expect(dayCountsByYmd(records, week, "feeding")["2026-08-12"]).toBe(1);
  });

  it("タイムライン用に時間帯へ振り分ける", () => {
    const records: CareRecord[] = [
      makeRecord({
        id: "later",
        recordType: "formula",
        recordedAt: "2026-08-12T15:00:00+09:00",
        detail: { type: "formula", formula: { amountMl: 80 } },
      }),
      makeRecord({
        id: "earlier",
        recordType: "formula",
        recordedAt: "2026-08-12T12:00:00+09:00",
        detail: { type: "formula", formula: { amountMl: 70 } },
      }),
    ];
    const buckets = groupRecordsByJstHour(records);
    expect(buckets[12].map((r) => r.id)).toEqual(["earlier"]);
    expect(buckets[15].map((r) => r.id)).toEqual(["later"]);
    expect(buckets[0]).toHaveLength(0);
  });

  it("睡眠は開始時刻の時間帯に置き、途中の時間も占める", () => {
    const day = new Date("2026-08-13T12:00:00+09:00");
    const sleep = makeRecord({
      id: "nap",
      recordType: "sleep",
      recordedAt: "2026-08-13T15:45:00+09:00",
      startedAt: "2026-08-13T12:45:00+09:00",
      endedAt: "2026-08-13T15:45:00+09:00",
      detail: {
        type: "sleep",
        sleep: {
          startedAt: "2026-08-13T12:45:00+09:00",
          endedAt: "2026-08-13T15:45:00+09:00",
          durationMinutes: 180,
        },
      },
    });
    const buckets = groupRecordsByJstHour([sleep], day);
    expect(buckets[12].map((r) => r.id)).toEqual(["nap"]);
    expect(buckets[15]).toHaveLength(0);
    expect([...sleepOccupiedHours([sleep], day)].sort((a, b) => a - b)).toEqual([
      12, 13, 14, 15,
    ]);
    expect(sleepSpansOnJstDay([sleep], day)).toEqual([
      { record: sleep, startHour: 12, endHour: 15 },
    ]);

    const week = jstWeekYmds(day);
    const marks = weekGridMarks([sleep], week, "sleep");
    expect(marks).toHaveLength(1);
    expect(marks[0]).toMatchObject({
      ymd: "2026-08-13",
      hour: 12,
      minute: 45,
      endHour: 15.75,
    });
  });

  it("選択した週の量を日別に集計する", () => {
    const week = jstWeekYmds(new Date("2026-08-12T12:00:00+09:00"));
    const metrics = computeWeekMetrics(
      [
        makeRecord({
          id: "1",
          recordType: "formula",
          recordedAt: "2026-08-12T12:00:00+09:00",
          detail: { type: "formula", formula: { amountMl: 70 } },
        }),
        makeRecord({
          id: "2",
          recordType: "formula",
          recordedAt: "2026-08-08T12:00:00+09:00",
          detail: { type: "formula", formula: { amountMl: 999 } },
        }),
      ],
      week,
    );
    expect(metrics.formulaMl.find((p) => p.date === "2026-08-12")?.value).toBe(
      70,
    );
    expect(metrics.formulaMl.reduce((sum, p) => sum + p.value, 0)).toBe(70);
    expect(metrics.feedingCounts.find((p) => p.date === "2026-08-12")?.value).toBe(
      1,
    );
  });
});
