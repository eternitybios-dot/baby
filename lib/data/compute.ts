import { jstYmd, startOfJstDay } from "@/lib/data/app-state";
import { formatAppDate } from "@/lib/date";
import type {
  CareRecord,
  ChartBundle,
  ChartPeriod,
  DailyMetricPoint,
  GrowthPoint,
  HomeStatus,
  TodaySummaryData,
} from "@/types/domain";

function isFeeding(record: CareRecord): boolean {
  return (
    record.recordType === "breast" ||
    record.recordType === "formula" ||
    record.recordType === "pumped"
  );
}

/** recorded_at DESC, id DESC（ページング境界の同時刻欠落を防ぐ） */
export function compareCareRecordsDesc(a: CareRecord, b: CareRecord): number {
  const byTime = b.recordedAt.localeCompare(a.recordedAt);
  if (byTime !== 0) return byTime;
  return b.id.localeCompare(a.id);
}

export function recordsOnJstDay(
  records: CareRecord[],
  day: Date,
): CareRecord[] {
  const dayStart = startOfJstDay(day).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  return records
    .filter((r) => {
      const t = new Date(r.recordedAt).getTime();
      return t >= dayStart && t < dayEnd;
    })
    .sort(compareCareRecordsDesc);
}

export function computeHomeStatus(
  records: CareRecord[],
): HomeStatus {
  const feeding = records.filter(isFeeding).sort(compareCareRecordsDesc)[0];
  const diaper = records
    .filter((r) => r.recordType === "diaper")
    .sort(compareCareRecordsDesc)[0];
  const sleep = records
    .filter((r) => r.recordType === "sleep" && r.detail.type === "sleep")
    .sort(compareCareRecordsDesc)[0];

  const lastSleepMinutes =
    sleep?.detail.type === "sleep"
      ? sleep.detail.sleep.durationMinutes ??
        (sleep.detail.sleep.endedAt
          ? Math.round(
              (new Date(sleep.detail.sleep.endedAt).getTime() -
                new Date(sleep.detail.sleep.startedAt).getTime()) /
                60000,
            )
          : null)
      : null;

  return {
    lastFeedingAt: feeding?.recordedAt ?? null,
    lastDiaperAt: diaper?.recordedAt ?? null,
    lastSleepAt: sleep?.recordedAt ?? null,
    lastSleepMinutes,
  };
}

export function computeTodaySummary(
  records: CareRecord[],
  now: Date,
): TodaySummaryData {
  const dayStart = startOfJstDay(now).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  const todays = records.filter((r) => {
    const t = new Date(r.recordedAt).getTime();
    return t >= dayStart && t < dayEnd;
  });

  let feedingCount = 0;
  let formulaMl = 0;
  let sleepMinutes = 0;
  let diaperCount = 0;

  for (const record of todays) {
    if (isFeeding(record)) feedingCount += 1;
    if (record.detail.type === "formula") {
      formulaMl += record.detail.formula.amountMl;
    }
    if (record.detail.type === "sleep") {
      const started = new Date(record.detail.sleep.startedAt).getTime();
      const ended = record.detail.sleep.endedAt
        ? new Date(record.detail.sleep.endedAt).getTime()
        : now.getTime();
      const overlapStart = Math.max(started, dayStart);
      const overlapEnd = Math.min(ended, dayEnd);
      if (overlapEnd > overlapStart) {
        sleepMinutes += Math.round((overlapEnd - overlapStart) / 60000);
      }
    }
    if (record.recordType === "diaper") diaperCount += 1;
  }

  return { feedingCount, formulaMl, sleepMinutes, diaperCount };
}

export function getTodayTimeline(
  records: CareRecord[],
  now: Date,
): CareRecord[] {
  return recordsOnJstDay(records, now);
}

export function chartPeriodDays(period: ChartPeriod): number {
  if (period === "30d") return 30;
  if (period === "custom") return 14;
  return 7;
}

function buildDateRange(period: ChartPeriod, now: Date, customDays = 7): string[] {
  const days = period === "30d" ? 30 : customDays;
  const list: string[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    list.push(jstYmd(d));
  }
  return list;
}

/** グラフ期間の取得範囲（JST 日付境界、to は排他） */
export function chartPeriodRange(
  period: ChartPeriod,
  now: Date,
): { fromIso: string; toIso: string; days: number } {
  const days = chartPeriodDays(period);
  const end = startOfJstDay(
    new Date(now.getTime() + 24 * 60 * 60 * 1000),
  );
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    days,
    fromIso: start.toISOString(),
    toIso: end.toISOString(),
  };
}

function emptyPoints(dates: string[]): DailyMetricPoint[] {
  return dates.map((date) => ({
    date,
    label:
      dates.length > 10
        ? formatAppDate(new Date(`${date}T12:00:00+09:00`), "d")
        : formatAppDate(new Date(`${date}T12:00:00+09:00`), "EEE"),
    value: 0,
  }));
}

export function computeCharts(
  records: CareRecord[],
  growth: GrowthPoint[],
  period: ChartPeriod,
  now: Date,
): ChartBundle {
  const dates = buildDateRange(period, now, period === "custom" ? 14 : 7);
  const sleepHours = emptyPoints(dates);
  const feedingCounts = emptyPoints(dates);
  const formulaMl = emptyPoints(dates);
  const diaperCounts = emptyPoints(dates);

  const index = new Map(dates.map((d, i) => [d, i]));

  for (const record of records) {
    const key = jstYmd(new Date(record.recordedAt));
    const i = index.get(key);
    if (i == null) continue;

    if (isFeeding(record)) feedingCounts[i].value += 1;
    if (record.detail.type === "formula") {
      formulaMl[i].value += record.detail.formula.amountMl;
    }
    if (record.recordType === "diaper") diaperCounts[i].value += 1;
    if (record.detail.type === "sleep") {
      const minutes =
        record.detail.sleep.durationMinutes ??
        (record.detail.sleep.endedAt
          ? Math.round(
              (new Date(record.detail.sleep.endedAt).getTime() -
                new Date(record.detail.sleep.startedAt).getTime()) /
                60000,
            )
          : 0);
      sleepHours[i].value += Number((minutes / 60).toFixed(1));
    }
  }

  // 小数を丸め直し
  for (const point of sleepHours) {
    point.value = Number(point.value.toFixed(1));
  }

  const weightKg: DailyMetricPoint[] = growth
    .filter((g) => g.weightG != null)
    .map((g) => ({
      date: g.measuredAt,
      label: formatAppDate(new Date(`${g.measuredAt}T12:00:00+09:00`), "M/d"),
      value: Number(((g.weightG ?? 0) / 1000).toFixed(2)),
    }));

  return { sleepHours, feedingCounts, formulaMl, diaperCounts, weightKg };
}
