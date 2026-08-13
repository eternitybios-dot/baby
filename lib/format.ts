import type { CareRecord, CareRecordType, DiaperKind } from "@/types/domain";
import { formatAppDate } from "@/lib/date";

export function formatDurationMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}分`;
  if (minutes === 0) return `${hours}時間`;
  return `${hours}時間${minutes}分`;
}

export function formatElapsed(fromIso: string | null, now: Date): string {
  if (!fromIso) return "まだなし";
  const diffMs = Math.max(0, now.getTime() - new Date(fromIso).getTime());
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes}分前`;
  return `${hours}時間${minutes}分前`;
}

export function formatClock(iso: string): string {
  return formatAppDate(new Date(iso), "HH:mm");
}

export function formatDisplayDate(isoOrDate: string | Date): string {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return formatAppDate(date, "M月d日(EEE)");
}

/** 記録画面ヘッダ用（例: 2026/8/12(水)） */
export function formatLogDate(isoOrDate: string | Date): string {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  return formatAppDate(date, "yyyy/M/d(EEE)");
}

/** 週の範囲（例: 2026/8/9〜2026/8/15） */
export function formatWeekRange(startYmd: string, endYmd: string): string {
  const start = formatAppDate(new Date(`${startYmd}T12:00:00+09:00`), "yyyy/M/d");
  const end = formatAppDate(new Date(`${endYmd}T12:00:00+09:00`), "yyyy/M/d");
  return `${start}〜${end}`;
}

export function diaperKindLabel(kind: DiaperKind): string {
  switch (kind) {
    case "urine":
      return "尿";
    case "stool":
      return "便";
    case "both":
      return "尿・便";
  }
}

export function recordTypeLabel(type: CareRecordType): string {
  const labels: Record<CareRecordType, string> = {
    breast: "母乳",
    formula: "ミルク",
    pumped: "搾乳",
    solid: "離乳食",
    sleep: "睡眠",
    diaper: "おむつ",
    temperature: "体温",
    medicine: "薬",
    symptom: "症状",
    clinic: "通院",
    bath: "お風呂",
    other: "その他",
    concern: "困り事",
  };
  return labels[type];
}

export function timelinePrimaryText(record: CareRecord): string {
  const detail = record.detail;
  switch (detail.type) {
    case "formula":
      return `ミルク ${detail.formula.amountMl}ml`;
    case "diaper":
      return `おむつ ${diaperKindLabel(detail.diaper.kind)}`;
    case "sleep": {
      if (detail.sleep.startedAt && detail.sleep.endedAt) {
        return `睡眠 ${formatClock(detail.sleep.startedAt)}〜${formatClock(detail.sleep.endedAt)}`;
      }
      const duration = detail.sleep.durationMinutes
        ? formatDurationMinutes(detail.sleep.durationMinutes)
        : "記録中";
      return `睡眠 ${duration}`;
    }
    case "breast":
      return `母乳 左${detail.breast.leftMinutes}分・右${detail.breast.rightMinutes}分`;
    case "temperature":
      return `体温 ${detail.temperature.celsius.toFixed(1)}℃`;
    case "concern":
      return detail.title;
    case "other":
      return detail.label;
  }
}

export function timelineTimeText(record: CareRecord): string {
  if (record.recordType === "sleep" && record.detail.type === "sleep") {
    const minutes =
      record.detail.sleep.durationMinutes ??
      (record.startedAt && record.endedAt
        ? Math.round(
            (new Date(record.endedAt).getTime() -
              new Date(record.startedAt).getTime()) /
              60000,
          )
        : null);
    if (minutes != null && minutes > 0) {
      return formatDurationMinutes(minutes);
    }
    return "記録中";
  }
  return formatClock(record.recordedAt);
}
