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

export function computeHomeStatus(
  records: CareRecord[],
  now: Date,
): HomeStatus {
  const formula = records
    .filter((r) => r.recordType === "formula" || r.detail.type === "formula")
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
  const diaper = records
    .filter((r) => r.recordType === "diaper")
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];
  const openSleep = records
    .filter(
      (r) =>
        r.recordType === "sleep" &&
        r.detail.type === "sleep" &&
        r.detail.sleep.endedAt == null,
    )
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))[0];

  return {
    lastFormulaAt: formula?.recordedAt ?? now.toISOString(),
    lastDiaperAt: diaper?.recordedAt ?? now.toISOString(),
    isSleeping: Boolean(openSleep),
    sleepStartedAt:
      openSleep?.detail.type === "sleep"
        ? openSleep.detail.sleep.startedAt
        : null,
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
  const dayStart = startOfJstDay(now).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  return records
    .filter((r) => {
      const t = new Date(r.recordedAt).getTime();
      return t >= dayStart && t < dayEnd;
    })
    .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
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
