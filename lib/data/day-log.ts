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
  /** 睡眠など、終了時刻があるときの小数時間（0–24） */
  endHour?: number;
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
    const bounds = sleepBounds(record);
    if (bounds) {
      marks.push(...sleepMarksForWeek(record, bounds, allowed));
      continue;
    }
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

function sleepMarksForWeek(
  record: CareRecord,
  bounds: { start: Date; end: Date },
  allowed: Set<string>,
): WeekGridMark[] {
  const marks: WeekGridMark[] = [];
  let cursor = startOfJstDay(bounds.start);
  const last = startOfJstDay(bounds.end);
  while (cursor.getTime() <= last.getTime()) {
    const ymd = jstYmd(cursor);
    const dayStart = cursor.getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    const start = Math.max(bounds.start.getTime(), dayStart);
    const end = Math.min(bounds.end.getTime(), dayEnd);
    cursor = new Date(dayEnd);
    if (!allowed.has(ymd) || end <= start) continue;
    const startDate = new Date(start);
    marks.push({
      ymd,
      hour: jstHour(startDate),
      minute: jstMinute(startDate),
      endHour: fractionalHourOnDay(end, dayStart),
      recordId: `${record.id}:${ymd}`,
      recordType: record.recordType,
    });
  }
  return marks;
}

function fractionalHourOnDay(timeMs: number, dayStartMs: number): number {
  const hours = (timeMs - dayStartMs) / (60 * 60 * 1000);
  return Math.min(24, Math.max(0, hours));
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
  day?: Date,
): CareRecord[][] {
  const buckets: CareRecord[][] = Array.from({ length: 24 }, () => []);
  const dayStart = day ? startOfJstDay(day) : null;
  const chronological = [...records].sort((a, b) => {
    const byTime = recordTimelineAt(a).getTime() - recordTimelineAt(b).getTime();
    if (byTime !== 0) return byTime;
    return a.id.localeCompare(b.id);
  });
  for (const record of chronological) {
    let at = recordTimelineAt(record);
    if (dayStart && at.getTime() < dayStart.getTime()) {
      at = dayStart;
    }
    buckets[jstHour(at)].push(record);
  }
  return buckets;
}

export function sleepBounds(
  record: CareRecord,
): { start: Date; end: Date } | null {
  if (record.recordType !== "sleep") return null;
  const startIso =
    record.startedAt ??
    (record.detail.type === "sleep" ? record.detail.sleep.startedAt : null);
  const endIso =
    record.endedAt ??
    (record.detail.type === "sleep" ? record.detail.sleep.endedAt : null) ??
    record.recordedAt;
  if (!startIso) return null;
  return { start: new Date(startIso), end: new Date(endIso) };
}

/** タイムライン上の位置。睡眠は開始時刻 */
export function recordTimelineAt(record: CareRecord): Date {
  return sleepBounds(record)?.start ?? new Date(record.recordedAt);
}

export function recordOverlapsJstDay(record: CareRecord, day: Date): boolean {
  const dayStart = startOfJstDay(day).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  const bounds = sleepBounds(record);
  if (bounds) {
    return bounds.start.getTime() < dayEnd && bounds.end.getTime() > dayStart;
  }
  const t = new Date(record.recordedAt).getTime();
  return t >= dayStart && t < dayEnd;
}

export function hoursOccupiedOnJstDay(
  record: CareRecord,
  day: Date,
): number[] {
  const dayStart = startOfJstDay(day);
  const dayStartMs = dayStart.getTime();
  const dayEndMs = dayStartMs + 24 * 60 * 60 * 1000;
  const bounds = sleepBounds(record);
  if (!bounds) {
    const t = new Date(record.recordedAt).getTime();
    if (t < dayStartMs || t >= dayEndMs) return [];
    return [jstHour(new Date(record.recordedAt))];
  }
  const start = Math.max(bounds.start.getTime(), dayStartMs);
  const end = Math.min(bounds.end.getTime(), dayEndMs);
  if (end <= start) return [];
  const first = jstHour(new Date(start));
  const last = jstHour(new Date(Math.max(start, end - 1)));
  const hours: number[] = [];
  for (let hour = first; hour <= last; hour += 1) hours.push(hour);
  return hours;
}

export function sleepOccupiedHours(
  records: CareRecord[],
  day: Date,
): Set<number> {
  const hours = new Set<number>();
  for (const record of records) {
    if (record.recordType !== "sleep") continue;
    for (const hour of hoursOccupiedOnJstDay(record, day)) hours.add(hour);
  }
  return hours;
}

export interface SleepDaySpan {
  record: CareRecord;
  startHour: number;
  endHour: number;
}

/** その日に重なる睡眠を、開始〜終了の時間帯（0–23）として返す */
export function sleepSpansOnJstDay(
  records: CareRecord[],
  day: Date,
): SleepDaySpan[] {
  const spans: SleepDaySpan[] = [];
  for (const record of records) {
    if (record.recordType !== "sleep") continue;
    const hours = hoursOccupiedOnJstDay(record, day);
    if (hours.length === 0) continue;
    spans.push({
      record,
      startHour: hours[0] ?? 0,
      endHour: hours[hours.length - 1] ?? 0,
    });
  }
  return spans;
}

export interface TimelineCardGroup {
  startHour: number;
  endHour: number;
  records: CareRecord[];
}

function compareTimelineRecords(a: CareRecord, b: CareRecord): number {
  const byTime = recordTimelineAt(a).getTime() - recordTimelineAt(b).getTime();
  if (byTime !== 0) return byTime;
  return a.id.localeCompare(b.id);
}

function hourSpanOnJstDay(
  record: CareRecord,
  day: Date,
): { startHour: number; endHour: number } | null {
  const hours = hoursOccupiedOnJstDay(record, day);
  if (hours.length === 0) return null;
  return { startHour: hours[0] ?? 0, endHour: hours[hours.length - 1] ?? 0 };
}

/** 睡眠カードは帯の中央の時間へ。その他は記録時刻の時間へ。 */
export function timelinePlacementHour(
  record: CareRecord,
  day: Date,
): number | null {
  const span = hourSpanOnJstDay(record, day);
  if (!span) return null;
  if (record.recordType === "sleep") {
    return Math.round((span.startHour + span.endHour) / 2);
  }
  return span.startHour;
}

function hourRangesOverlap(
  a: { startHour: number; endHour: number },
  b: { startHour: number; endHour: number },
): boolean {
  return a.startHour <= b.endHour && b.startHour <= a.endHour;
}

/**
 * カード用グリッドセル。複数時間にまたぐのは「その帯に他のカードが無い睡眠」だけ。
 * 帯と他記録が重なるときは開始時刻の早い順に、同じ時間のセルへ積み替える。
 * セルの時間範囲は互いに重ならない。
 */
export function timelineCardGroups(
  records: CareRecord[],
  day: Date,
): TimelineCardGroup[] {
  const sleeps: { record: CareRecord; startHour: number; endHour: number }[] =
    [];
  const instantHours = new Set<number>();

  for (const record of records) {
    if (record.recordType === "sleep") {
      const span = hourSpanOnJstDay(record, day);
      if (!span) continue;
      sleeps.push({ record, ...span });
    } else {
      const hour = timelinePlacementHour(record, day);
      if (hour == null) continue;
      instantHours.add(hour);
    }
  }

  sleeps.sort((a, b) => compareTimelineRecords(a.record, b.record));

  const used = new Set<string>();
  const groups: TimelineCardGroup[] = [];

  for (const sleep of sleeps) {
    if (used.has(sleep.record.id)) continue;
    const crowdedByInstant = [...instantHours].some(
      (hour) => hour >= sleep.startHour && hour <= sleep.endHour,
    );
    const crowdedBySleep = sleeps.some(
      (other) =>
        other.record.id !== sleep.record.id &&
        hourRangesOverlap(sleep, other),
    );
    if (crowdedByInstant || crowdedBySleep) continue;
    groups.push({
      startHour: sleep.startHour,
      endHour: sleep.endHour,
      records: [sleep.record],
    });
    used.add(sleep.record.id);
  }

  const buckets = new Map<number, CareRecord[]>();
  for (const record of records) {
    if (used.has(record.id)) continue;
    const hour = timelinePlacementHour(record, day);
    if (hour == null) continue;
    const list = buckets.get(hour) ?? [];
    list.push(record);
    buckets.set(hour, list);
  }

  for (const hour of [...buckets.keys()].sort((a, b) => a - b)) {
    const bucket = buckets.get(hour);
    if (!bucket || bucket.length === 0) continue;
    groups.push({
      startHour: hour,
      endHour: hour,
      records: [...bucket].sort(compareTimelineRecords),
    });
  }

  return groups.sort(
    (a, b) => a.startHour - b.startHour || a.endHour - b.endHour,
  );
}

export function timelineGroupsOverlapHours(
  groups: TimelineCardGroup[],
): boolean {
  const sorted = [...groups].sort(
    (a, b) => a.startHour - b.startHour || a.endHour - b.endHour,
  );
  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const next = sorted[i];
    if (!prev || !next) continue;
    if (hourRangesOverlap(prev, next)) return true;
  }
  return false;
}
