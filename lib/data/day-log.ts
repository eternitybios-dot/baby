import { jstYmd, startOfJstDay } from "@/lib/data/app-state";
import { formatAppDate } from "@/lib/date";
import type { CareRecord, CareRecordType, DailyMetricPoint } from "@/types/domain";

export type SummaryCategory =
  | "feeding"
  | "sleep"
  | "diaper"
  | "temperature"
  | "all";

export interface WeekGridMark {
  ymd: string;
  hour: number;
  minute: number;
  recordId: string;
  recordType: CareRecordType;
}

const WEEKDAY_SHORT: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export function jstHour(date: Date): number {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tokyo",
      hour: "2-digit",
      hour12: false,
    })
      .formatToParts(date)
      .find((part) => part.type === "hour")?.value ?? "0",
  );
  return hour === 24 ? 0 : hour;
}

export function jstMinute(date: Date): number {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tokyo",
      minute: "2-digit",
    })
      .formatToParts(date)
      .find((part) => part.type === "minute")?.value ?? "0",
  );
}

/** JST の曜日。0 = 日曜 */
export function jstWeekdaySunday0(date: Date): number {
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    weekday: "short",
  }).format(date);
  return WEEKDAY_SHORT[label] ?? 0;
}

export function startOfJstWeekSunday(date: Date): Date {
  const start = startOfJstDay(date);
  const weekday = jstWeekdaySunday0(start);
  return new Date(start.getTime() - weekday * 24 * 60 * 60 * 1000);
}

export function jstWeekYmds(anchor: Date): string[] {
  const start = startOfJstWeekSunday(anchor);
  return Array.from({ length: 7 }, (_, i) =>
    jstYmd(new Date(start.getTime() + i * 24 * 60 * 60 * 1000)),
  );
}

export function addJstDays(ymd: string, days: number): string {
  const date = new Date(`${ymd}T12:00:00+09:00`);
  return jstYmd(new Date(date.getTime() + days * 24 * 60 * 60 * 1000));
}

export function dateFromJstYmd(ymd: string): Date {
  return startOfJstDay(new Date(`${ymd}T12:00:00+09:00`));
}

export function mergeCareRecords(...lists: CareRecord[][]): CareRecord[] {
  const map = new Map<string, CareRecord>();
  for (const list of lists) {
    for (const record of list) {
      map.set(record.id, record);
    }
  }
  return [...map.values()];
}

export function isFeedingRecord(record: CareRecord): boolean {
  return (
    record.recordType === "breast" ||
    record.recordType === "formula" ||
    record.recordType === "pumped" ||
    record.recordType === "solid"
  );
}

export function recordMatchesCategory(
  record: CareRecord,
  category: SummaryCategory,
): boolean {
  switch (category) {
    case "feeding":
      return isFeedingRecord(record);
    case "sleep":
      return record.recordType === "sleep";
    case "diaper":
      return record.recordType === "diaper";
    case "temperature":
      return record.recordType === "temperature";
    case "all":
      return record.recordType !== "concern";
  }
}

export function weekGridMarks(
  records: CareRecord[],
  weekYmds: string[],
  category: SummaryCategory,
): WeekGridMark[] {
  const allowed = new Set(weekYmds);
  const marks: WeekGridMark[] = [];
  for (const record of records) {
    if (!recordMatchesCategory(record, category)) continue;
    const at = new Date(record.recordedAt);
    const ymd = jstYmd(at);
    if (!allowed.has(ymd)) continue;
    marks.push({
      ymd,
      hour: jstHour(at),
      minute: jstMinute(at),
      recordId: record.id,
      recordType: record.recordType,
    });
  }
  return marks;
}

export function dayCountsByYmd(
  records: CareRecord[],
  weekYmds: string[],
  category: SummaryCategory,
): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(
    weekYmds.map((ymd) => [ymd, 0]),
  );
  for (const record of records) {
    if (!recordMatchesCategory(record, category)) continue;
    const ymd = jstYmd(new Date(record.recordedAt));
    if (ymd in counts) counts[ymd] += 1;
  }
  return counts;
}

function emptyWeekPoints(weekYmds: string[]): DailyMetricPoint[] {
  return weekYmds.map((date) => ({
    date,
    label: formatAppDate(new Date(`${date}T12:00:00+09:00`), "M/d"),
    value: 0,
  }));
}

export function computeWeekMetrics(
  records: CareRecord[],
  weekYmds: string[],
): {
  feedingCounts: DailyMetricPoint[];
  formulaMl: DailyMetricPoint[];
  sleepHours: DailyMetricPoint[];
  diaperCounts: DailyMetricPoint[];
} {
  const feedingCounts = emptyWeekPoints(weekYmds);
  const formulaMl = emptyWeekPoints(weekYmds);
  const sleepHours = emptyWeekPoints(weekYmds);
  const diaperCounts = emptyWeekPoints(weekYmds);
  const index = new Map(weekYmds.map((ymd, i) => [ymd, i]));

  for (const record of records) {
    const i = index.get(jstYmd(new Date(record.recordedAt)));
    if (i == null) continue;
    if (isFeedingRecord(record)) feedingCounts[i].value += 1;
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

  for (const point of sleepHours) {
    point.value = Number(point.value.toFixed(1));
  }

  return { feedingCounts, formulaMl, sleepHours, diaperCounts };
}

export function groupRecordsByJstHour(
  records: CareRecord[],
): CareRecord[][] {
  const buckets: CareRecord[][] = Array.from({ length: 24 }, () => []);
  const chronological = [...records].sort((a, b) =>
    a.recordedAt.localeCompare(b.recordedAt),
  );
  for (const record of chronological) {
    buckets[jstHour(new Date(record.recordedAt))].push(record);
  }
  return buckets;
}
