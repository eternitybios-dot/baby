/** ブラウザ通知ヘルパー */

import type { CareRecord, Concern, GrowthPoint, Habit } from "@/types/domain";
import { timelinePrimaryText } from "@/lib/format";

const NOTIFY_PREF_KEY = "sukusuku-notify-enabled";
const localCreatedIds = new Set<string>();

/** 自分の端末で作った ID（相手通知の誤発火防止） */
export function markLocalCreated(id: string): void {
  localCreatedIds.add(id);
  if (typeof window === "undefined") return;
  window.setTimeout(() => localCreatedIds.delete(id), 15_000);
}

export function wasLocalCreated(id: string): boolean {
  return localCreatedIds.has(id);
}

export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export function getNotificationPref(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(NOTIFY_PREF_KEY) === "1";
}

export function setNotificationPref(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(NOTIFY_PREF_KEY, enabled ? "1" : "0");
}

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

export async function enableNotifications(): Promise<boolean> {
  const permission = await ensureNotificationPermission();
  const ok = permission === "granted";
  setNotificationPref(ok);
  return ok;
}

export function disableNotifications(): void {
  setNotificationPref(false);
}

function appPath(path: string): string {
  if (typeof window === "undefined") return path;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (window.location.pathname.startsWith("/baby/")) {
    return `/baby${normalized.endsWith("/") ? normalized : `${normalized}/`}`;
  }
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

function showOsNotification(input: {
  title: string;
  body: string;
  tag: string;
  href: string;
}): void {
  if (!isNotificationSupported()) return;
  if (!getNotificationPref()) return;
  if (Notification.permission !== "granted") return;

  try {
    const n = new Notification(input.title, {
      body: input.body,
      tag: input.tag,
      lang: "ja",
    });
    n.onclick = () => {
      window.focus();
      n.close();
      window.location.assign(input.href);
    };
  } catch {
    /* 一部ブラウザでは失敗しうる */
  }
}

export function notifyNewCareRecord(record: CareRecord): void {
  const primary = timelinePrimaryText(record);
  showOsNotification({
    title: primary,
    body: `${record.recorder.displayName}が記録しました`,
    tag: `care-${record.id}`,
    href: appPath("/home"),
  });
}

export function notifyNewConcern(concern: Concern): void {
  showOsNotification({
    title: `困り事: ${concern.title}`,
    body: [concern.body, `${concern.recorder.displayName}が追加`]
      .filter(Boolean)
      .join(" ／ "),
    tag: `concern-${concern.id}`,
    href: appPath("/concerns"),
  });
}

export function notifyNewGrowth(
  point: GrowthPoint,
  recorderName: string,
): void {
  const parts: string[] = [];
  if (point.weightG != null) parts.push(`体重 ${(point.weightG / 1000).toFixed(2)}kg`);
  if (point.heightCm != null) parts.push(`身長 ${point.heightCm}cm`);
  if (point.headCircumferenceCm != null) {
    parts.push(`頭囲 ${point.headCircumferenceCm}cm`);
  }
  showOsNotification({
    title: "成長記録",
    body: [parts.join("・") || "新しい計測", `${recorderName}が追加`]
      .filter(Boolean)
      .join(" ／ "),
    tag: `growth-${point.id}`,
    href: appPath("/growth"),
  });
}

export function notifyNewHabit(habit: Habit, recorderName: string): void {
  showOsNotification({
    title: `習慣: ${habit.name}`,
    body: [habit.body, `${recorderName}が追加`].filter(Boolean).join(" ／ "),
    tag: `habit-${habit.id}`,
    href: appPath("/habits"),
  });
}
