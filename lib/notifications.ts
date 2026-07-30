/** ブラウザ通知ヘルパー */

import type { Concern } from "@/types/domain";

const NOTIFY_PREF_KEY = "sukusuku-notify-enabled";

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

function concernsPath(): string {
  if (typeof window === "undefined") return "/concerns/";
  if (window.location.pathname.startsWith("/baby/")) return "/baby/concerns/";
  return "/concerns/";
}

/** 相手が追加した困り事の OS 通知 */
export function notifyNewConcern(concern: Concern): void {
  if (!isNotificationSupported()) return;
  if (!getNotificationPref()) return;
  if (Notification.permission !== "granted") return;

  const title = `困り事: ${concern.title}`;
  const body = [concern.body, `${concern.recorder.displayName}が追加`]
    .filter(Boolean)
    .join(" ／ ");

  try {
    const n = new Notification(title, {
      body,
      tag: `concern-${concern.id}`,
      lang: "ja",
    });
    n.onclick = () => {
      window.focus();
      n.close();
      window.location.assign(concernsPath());
    };
  } catch {
    /* 一部ブラウザでは失敗しうる */
  }
}
