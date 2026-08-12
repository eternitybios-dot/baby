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
  if (record.recordType === "sleep" && record.startedAt && record.endedAt) {
    return `${formatClock(record.startedAt)}〜${formatClock(record.endedAt)}`;
  }
  return formatClock(record.recordedAt);
}
