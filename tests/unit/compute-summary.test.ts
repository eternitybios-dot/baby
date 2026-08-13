import { describe, expect, it } from "vitest";
import {
  computeCharts,
  computeHomeStatus,
  computeTodaySummary,
  getTodayTimeline,
  recordsOnJstDay,
} from "@/lib/data/compute";
import type { CareRecord, GrowthPoint } from "@/types/domain";

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

describe("授乳・睡眠・おむつの集計", () => {
  it("今日の授乳・ミルク・睡眠・おむつを集計する", () => {
    const now = new Date("2026-08-01T12:00:00+09:00");
    const records: CareRecord[] = [
      makeRecord({
        id: "1",
        recordType: "breast",
        recordedAt: "2026-08-01T08:00:00.000+09:00",
        detail: {
          type: "breast",
          breast: { leftMinutes: 10, rightMinutes: 8 },
        },
      }),
      makeRecord({
        id: "2",
        recordType: "formula",
        recordedAt: "2026-08-01T10:00:00.000+09:00",
        detail: { type: "formula", formula: { amountMl: 120 } },
      }),
      makeRecord({
        id: "3",
        recordType: "diaper",
        recordedAt: "2026-08-01T11:00:00.000+09:00",
        detail: { type: "diaper", diaper: { kind: "urine" } },
      }),
      makeRecord({
        id: "4",
        recordType: "sleep",
        recordedAt: "2026-08-01T09:30:00.000+09:00",
        detail: {
          type: "sleep",
          sleep: {
            startedAt: "2026-08-01T08:30:00.000+09:00",
            endedAt: "2026-08-01T09:30:00.000+09:00",
            durationMinutes: 60,
          },
        },
      }),
      // 昨日の記録は除外
      makeRecord({
        id: "5",
        recordType: "formula",
        recordedAt: "2026-07-31T10:00:00.000+09:00",
        detail: { type: "formula", formula: { amountMl: 200 } },
      }),
    ];

    const summary = computeTodaySummary(records, now);
    expect(summary.feedingCount).toBe(2);
    expect(summary.formulaMl).toBe(120);
    expect(summary.diaperCount).toBe(1);
    expect(summary.sleepMinutes).toBe(60);

    const timeline = getTodayTimeline(records, now);
    expect(timeline.map((r) => r.id)).toEqual(["3", "2", "4", "1"]);
  });

  it("睡眠が日をまたぐと開始した日にも載る", () => {
    const sleep = makeRecord({
      id: "night",
      recordType: "sleep",
      recordedAt: "2026-08-13T06:30:00+09:00",
      startedAt: "2026-08-12T22:00:00+09:00",
      endedAt: "2026-08-13T06:30:00+09:00",
      detail: {
        type: "sleep",
        sleep: {
          startedAt: "2026-08-12T22:00:00+09:00",
          endedAt: "2026-08-13T06:30:00+09:00",
          durationMinutes: 510,
        },
      },
    });
    expect(
      recordsOnJstDay([sleep], new Date("2026-08-12T12:00:00+09:00")).map(
        (r) => r.id,
      ),
    ).toEqual(["night"]);
    expect(
      recordsOnJstDay([sleep], new Date("2026-08-13T12:00:00+09:00")).map(
        (r) => r.id,
      ),
    ).toEqual(["night"]);
  });

  it("記録が無いときは最後の授乳・おむつをまだなしにする", () => {
    const status = computeHomeStatus([]);
    expect(status.lastFeedingAt).toBeNull();
    expect(status.lastDiaperAt).toBeNull();
    expect(status.lastSleepAt).toBeNull();
  });

  it("最後の授乳は母乳も含める", () => {
    const status = computeHomeStatus(
      [
        makeRecord({
          id: "b",
          recordType: "breast",
          recordedAt: "2026-08-01T11:00:00.000+09:00",
          detail: {
            type: "breast",
            breast: { leftMinutes: 5, rightMinutes: 5 },
          },
        }),
      ],
    );
    expect(status.lastFeedingAt).toBe("2026-08-01T11:00:00.000+09:00");
  });
});

describe("グラフ期間集計", () => {
  it("選択期間内だけを日別集計する", () => {
    const now = new Date("2026-08-01T12:00:00+09:00");
    const records: CareRecord[] = [
      makeRecord({
        id: "a",
        recordType: "formula",
        recordedAt: "2026-08-01T10:00:00.000+09:00",
        detail: { type: "formula", formula: { amountMl: 100 } },
      }),
      makeRecord({
        id: "b",
        recordType: "formula",
        recordedAt: "2026-07-20T10:00:00.000+09:00",
        detail: { type: "formula", formula: { amountMl: 999 } },
      }),
    ];
    const growth: GrowthPoint[] = [];
    const charts = computeCharts(records, growth, "7d", now);
    const totalMl = charts.formulaMl.reduce((sum, p) => sum + p.value, 0);
    expect(totalMl).toBe(100);
    expect(charts.formulaMl).toHaveLength(7);
  });
});

describe("500件超の記録処理", () => {
  it("大量レコードでも集計が落ちず件数どおりになる", () => {
    const now = new Date("2026-08-01T23:00:00+09:00");
    const records: CareRecord[] = Array.from({ length: 600 }, (_, i) =>
      makeRecord({
        id: `r-${i}`,
        recordType: "diaper",
        recordedAt: new Date(
          now.getTime() - i * 60_000,
        ).toISOString(),
        detail: { type: "diaper", diaper: { kind: "urine" } },
      }),
    );

    const summary = computeTodaySummary(records, now);
    expect(summary.diaperCount).toBeGreaterThan(100);
    expect(records).toHaveLength(600);

    const charts = computeCharts(records, [], "30d", now);
    const total = charts.diaperCounts.reduce((s, p) => s + p.value, 0);
    expect(total).toBeGreaterThan(500);
    expect(total).toBeLessThanOrEqual(600);
  });
});
