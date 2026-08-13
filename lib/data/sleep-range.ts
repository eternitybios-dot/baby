import { jstYmd } from "@/lib/data/app-state";
import { formatAppDate } from "@/lib/date";

export type SleepRangeResult =
  | {
      ok: true;
      startedAt: string;
      endedAt: string;
      durationMinutes: number;
    }
  | { ok: false; error: string };

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function parseHm(
  value: string,
): { hours: number; minutes: number } | null {
  const match = value.trim().match(/^(\d{1,2}):([0-5]\d)(?::[0-5]\d)?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  if (hours > 23) return null;
  return { hours, minutes: Number(match[2]) };
}

export function formatHm(hours: number, minutes: number): string {
  return `${pad2(hours)}:${pad2(minutes)}`;
}

/** JST の HH:mm */
export function jstHm(date: Date): string {
  return formatAppDate(date, "HH:mm");
}

/**
 * 開始・終了の時刻から睡眠区間を作る。
 * 終了が開始以前なら、開始はアンカー日の前日（夜〜朝）とみなす。
 */
export function buildSleepRange(input: {
  startHm: string;
  endHm: string;
  anchor?: Date;
}): SleepRangeResult {
  const start = parseHm(input.startHm);
  const end = parseHm(input.endHm);
  if (!start || !end) {
    return { ok: false, error: "開始と終了の時刻を入力してください" };
  }

  const ymd = jstYmd(input.anchor ?? new Date());
  const startHm = formatHm(start.hours, start.minutes);
  const endHm = formatHm(end.hours, end.minutes);
  let startedAt = new Date(`${ymd}T${startHm}:00+09:00`);
  const endedAt = new Date(`${ymd}T${endHm}:00+09:00`);

  if (endedAt.getTime() < startedAt.getTime()) {
    startedAt = new Date(startedAt.getTime() - 24 * 60 * 60 * 1000);
  }

  const durationMinutes = Math.round(
    (endedAt.getTime() - startedAt.getTime()) / 60_000,
  );
  if (durationMinutes <= 0) {
    return { ok: false, error: "終了は開始より後にしてください" };
  }

  return {
    ok: true,
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
    durationMinutes,
  };
}

export function defaultSleepTimes(now = new Date()): {
  startHm: string;
  endHm: string;
} {
  return {
    startHm: jstHm(new Date(now.getTime() - 60 * 60 * 1000)),
    endHm: jstHm(now),
  };
}
