import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { differenceInCalendarMonths, differenceInDays } from "date-fns";
import { ja } from "date-fns/locale";
import { APP_TIMEZONE } from "@/lib/constants";

/** 現在時刻を Asia/Tokyo の Date として扱う */
export function nowInAppTimezone(date: Date = new Date()): Date {
  return toZonedTime(date, APP_TIMEZONE);
}

/** JST 基準の日付文字列 */
export function formatAppDate(
  date: Date,
  pattern = "yyyy-MM-dd",
): string {
  return formatInTimeZone(date, APP_TIMEZONE, pattern, { locale: ja });
}

/** 生年月日から月齢表示（例: 3か月12日）を生成 */
export function formatAgeInMonths(birthDate: Date, now: Date = new Date()): string {
  const months = differenceInCalendarMonths(now, birthDate);
  const afterMonths = new Date(birthDate);
  afterMonths.setMonth(afterMonths.getMonth() + months);
  const days = differenceInDays(now, afterMonths);

  if (months <= 0) {
    return `${Math.max(days, 0)}日`;
  }
  return `${months}か月${days > 0 ? `${days}日` : ""}`;
}
