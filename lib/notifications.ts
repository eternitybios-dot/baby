/** iOS ホーム画面アプリ対応の通知ヘルパー */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CareRecord, Concern, GrowthPoint, Habit } from "@/types/domain";
import { timelinePrimaryText } from "@/lib/format";
import {
  getVapidPublicKey,
  hasVapidPublicKey,
} from "@/lib/push/vapid-public";

const NOTIFY_PREF_KEY = "sukusuku-notify-enabled";
const PUSH_REGISTERED_KEY = "sukusuku-push-registered";
const localCreatedIds = new Set<string>();

let swReady: Promise<ServiceWorkerRegistration | null> | null = null;

export type EnableNotificationsResult = {
  /** Push 購読まで含めて相手通知の準備ができたときだけ true */
  ok: boolean;
  permissionGranted: boolean;
  pushRegistered: boolean;
  detail?: string;
};

export type NotifyPushResult =
  | { ok: true; sent: number; total: number; status: "ok" | "no_recipients" }
  | {
      ok: false;
      error: string;
      sent?: number;
      total?: number;
      status?: "failed" | "partial";
    };

export function markLocalCreated(id: string): void {
  localCreatedIds.add(id);
  if (typeof window === "undefined") return;
  window.setTimeout(() => localCreatedIds.delete(id), 15_000);
}

export function wasLocalCreated(id: string): boolean {
  return localCreatedIds.has(id);
}

export function getAppBasePath(): string {
  if (typeof window === "undefined") return "";
  return window.location.pathname.startsWith("/baby/") ? "/baby" : "";
}

export function appPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const withSlash = normalized.endsWith("/") ? normalized : `${normalized}/`;
  return `${getAppBasePath()}${withSlash}`;
}

export function isNotificationSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  );
}

export function isPushManagerSupported(): boolean {
  return typeof window !== "undefined" && "PushManager" in window;
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
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

export function getPushRegisteredPref(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(PUSH_REGISTERED_KEY) === "1";
}

export function setPushRegisteredPref(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PUSH_REGISTERED_KEY, enabled ? "1" : "0");
}

/** 端末許可済みかつ Push 購読保存済みのときだけ「通知オン」とみなす */
export function isPartnerNotifyReady(): boolean {
  return (
    getNotificationPref() &&
    getPushRegisteredPref() &&
    getNotificationPermission() === "granted"
  );
}

export async function ensureServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }
  if (!swReady) {
    swReady = (async () => {
      try {
        const base = getAppBasePath();
        const reg = await navigator.serviceWorker.register(
          `${base}/sw.js?v=20260802-baby-icon`,
          {
            scope: `${base}/`,
            updateViaCache: "none",
          },
        );
        await reg.update();
        await navigator.serviceWorker.ready;
        return reg;
      } catch {
        return null;
      }
    })();
  }
  return swReady;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
}

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  await ensureServiceWorker();
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return Notification.requestPermission();
}

async function subscribePush(
  registration: ServiceWorkerRegistration,
): Promise<{ sub: PushSubscription | null; reason?: string }> {
  if (!hasVapidPublicKey()) {
    return {
      sub: null,
      reason:
        "通知用の公開鍵がありません。アプリを最新版に更新するか、管理者に設定を依頼してください",
    };
  }
  if (!("PushManager" in window)) {
    return {
      sub: null,
      reason:
        "この環境は Push 通知に対応していません。ホーム画面に追加したアプリから開いてください（Safariのタブでは使えません）",
    };
  }
  try {
    const existing = await registration.pushManager.getSubscription();
    if (existing) return { sub: existing };
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        getVapidPublicKey(),
      ) as BufferSource,
    });
    return { sub };
  } catch {
    return {
      sub: null,
      reason:
        "Push 購読に失敗しました。ホーム画面アイコンから開き、iOS 16.4以降か確認してください",
    };
  }
}

export async function removeLocalPushSubscription(): Promise<void> {
  const registration = await ensureServiceWorker();
  if (!registration) return;
  try {
    const existing = await registration.pushManager.getSubscription();
    if (existing) await existing.unsubscribe();
  } catch {
    /* ignore */
  }
}

export async function deletePushSubscriptionRemote(
  supabase: SupabaseClient,
  endpoint: string,
): Promise<void> {
  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint);
  if (error) throw error;
}

export async function savePushSubscription(
  supabase: SupabaseClient,
  familyId: string,
  userId: string,
): Promise<{ ok: boolean; reason?: string }> {
  if (!hasVapidPublicKey()) {
    setPushRegisteredPref(false);
    return {
      ok: false,
      reason:
        "通知用の公開鍵がありません。アプリを最新版に更新するか、管理者に設定を依頼してください",
    };
  }

  const registration = await ensureServiceWorker();
  if (!registration) {
    setPushRegisteredPref(false);
    return {
      ok: false,
      reason:
        "Service Worker を登録できませんでした。ホーム画面アプリから開き直してください",
    };
  }
  const { sub, reason } = await subscribePush(registration);
  if (!sub) {
    setPushRegisteredPref(false);
    return {
      ok: false,
      reason:
        reason ??
        "Push 購読に失敗しました。ホーム画面アイコンから開き、iOS 16.4以降か確認してください",
    };
  }

  const json = sub.toJSON();
  const endpoint = json.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    setPushRegisteredPref(false);
    return { ok: false, reason: "Push 購読情報が不完全です" };
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: userId,
      family_id: familyId,
      endpoint,
      p256dh,
      auth,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );
  if (error) {
    setPushRegisteredPref(false);
    return {
      ok: false,
      reason:
        "購読の保存に失敗しました。Supabase で 003_push_subscriptions.sql を実行してください",
    };
  }
  setPushRegisteredPref(true);
  return { ok: true };
}

export async function enableNotifications(input?: {
  supabase?: SupabaseClient | null;
  familyId?: string;
  userId?: string;
}): Promise<EnableNotificationsResult> {
  if (!isNotificationSupported()) {
    setNotificationPref(false);
    setPushRegisteredPref(false);
    return {
      ok: false,
      permissionGranted: false,
      pushRegistered: false,
      detail:
        "このブラウザは通知に対応していません。ホーム画面に追加したアプリから開いてください",
    };
  }

  await ensureServiceWorker();
  const permission = await ensureNotificationPermission();
  if (permission !== "granted") {
    setNotificationPref(false);
    setPushRegisteredPref(false);
    return {
      ok: false,
      permissionGranted: false,
      pushRegistered: false,
      detail:
        permission === "denied"
          ? "通知が拒否されています。iPhoneの設定 → 通知 から許可してください"
          : "通知が許可されませんでした。ホーム画面アプリから開き直してください",
    };
  }

  setNotificationPref(true);

  if (!input?.supabase || !input.familyId || !input.userId) {
    setPushRegisteredPref(false);
    return {
      ok: false,
      permissionGranted: true,
      pushRegistered: false,
      detail:
        "端末通知は許可されましたが、相手からの通知設定は未完了です（サーバー未接続）",
    };
  }

  const saved = await savePushSubscription(
    input.supabase,
    input.familyId,
    input.userId,
  );
  if (!saved.ok) {
    setPushRegisteredPref(false);
    await showOsNotification({
      title: "すくすくログ",
      body: "端末の通知許可はOKです（相手への配信設定は未完了）",
      tag: "sukusuku-test",
      href: appPath("/home"),
    });
    return {
      ok: false,
      permissionGranted: true,
      pushRegistered: false,
      detail:
        saved.reason ??
        "端末通知は許可されましたが、相手からの通知設定は未完了です",
    };
  }

  await showOsNotification({
    title: "すくすくログ",
    body: "通知がオンになりました",
    tag: "sukusuku-test",
    href: appPath("/home"),
  });
  return {
    ok: true,
    permissionGranted: true,
    pushRegistered: true,
    detail: "通知オン。テスト通知を送りました",
  };
}

export async function disableNotifications(
  supabase?: SupabaseClient | null,
): Promise<void> {
  setNotificationPref(false);
  setPushRegisteredPref(false);
  try {
    const registration = await ensureServiceWorker();
    const existing = registration
      ? await registration.pushManager.getSubscription()
      : null;
    if (existing) {
      const endpoint = existing.endpoint;
      await existing.unsubscribe();
      if (supabase && endpoint) {
        await deletePushSubscriptionRemote(supabase, endpoint).catch(() => {
          /* ローカル解除は成功扱い */
        });
      }
    }
  } catch {
    /* ignore */
  }
}

export async function showOsNotification(input: {
  title: string;
  body: string;
  tag: string;
  href: string;
}): Promise<void> {
  if (!getNotificationPref()) return;
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const registration = await ensureServiceWorker();
  const href = input.href;

  if (registration) {
    const worker =
      registration.active ?? registration.waiting ?? registration.installing;
    if (worker) {
      worker.postMessage({
        type: "SHOW_NOTIFICATION",
        title: input.title,
        body: input.body,
        tag: input.tag,
        url: href,
      });
      return;
    }
    try {
      await registration.showNotification(input.title, {
        body: input.body,
        tag: input.tag,
        data: { url: href },
        lang: "ja",
      });
      return;
    } catch {
      /* fall through */
    }
  }

  try {
    const n = new Notification(input.title, {
      body: input.body,
      tag: input.tag,
      lang: "ja",
    });
    n.onclick = () => {
      window.focus();
      n.close();
      window.location.assign(href);
    };
  } catch {
    /* ignore */
  }
}

export async function notifyFamilyPush(
  supabase: SupabaseClient,
  input: {
    familyId: string;
    title: string;
    body: string;
    url: string;
    excludeUserId: string;
  },
): Promise<NotifyPushResult> {
  try {
    const { data, error } = await supabase.functions.invoke("notify-family", {
      body: {
        familyId: input.familyId,
        title: input.title,
        body: input.body,
        url: input.url,
        excludeUserId: input.excludeUserId,
      },
    });
    if (error) {
      return {
        ok: false,
        error: error.message || "相手への通知送信に失敗しました",
      };
    }
    const payload = data as {
      ok?: boolean;
      sent?: number;
      total?: number;
      status?: string;
      error?: string;
    } | null;
    if (payload?.error) {
      return { ok: false, error: String(payload.error) };
    }
    const sent = Number(payload?.sent ?? 0);
    const total = Number(payload?.total ?? 0);
    const status = payload?.status;
    // Edge Function が ok:true でも sent < total なら失敗扱い（後方互換）
    if (payload?.ok === false || (total > 0 && sent < total)) {
      const kind =
        status === "partial" || (sent > 0 && sent < total)
          ? "partial"
          : "failed";
      return {
        ok: false,
        status: kind,
        sent,
        total,
        error:
          kind === "partial"
            ? `相手への通知が一部失敗しました（${sent}/${total}）`
            : total > 0
              ? `相手への通知を送れませんでした（0/${total}）`
              : "相手への通知送信に失敗しました",
      };
    }
    return {
      ok: true,
      sent,
      total,
      status: status === "no_recipients" ? "no_recipients" : "ok",
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "相手への通知送信に失敗しました",
    };
  }
}

export function notifyNewCareRecord(record: CareRecord): void {
  const primary = timelinePrimaryText(record);
  void showOsNotification({
    title: primary,
    body: `${record.recorder.displayName}が記録しました`,
    tag: `care-${record.id}`,
    href: appPath("/home"),
  });
}

export function notifyNewConcern(concern: Concern): void {
  void showOsNotification({
    title: `困り事: ${concern.title}`,
    body: [concern.body, `${concern.recorder.displayName}が追加`]
      .filter(Boolean)
      .join(" ／ "),
    tag: `concern-${concern.id}`,
    href: appPath("/concerns"),
  });
}

export function notifyNewGrowth(point: GrowthPoint, recorderName: string): void {
  const parts: string[] = [];
  if (point.weightG != null) parts.push(`体重 ${(point.weightG / 1000).toFixed(2)}kg`);
  if (point.heightCm != null) parts.push(`身長 ${point.heightCm}cm`);
  if (point.headCircumferenceCm != null) {
    parts.push(`頭囲 ${point.headCircumferenceCm}cm`);
  }
  void showOsNotification({
    title: "成長記録",
    body: [parts.join("・") || "新しい計測", `${recorderName}が追加`]
      .filter(Boolean)
      .join(" ／ "),
    tag: `growth-${point.id}`,
    href: appPath("/growth"),
  });
}

export function notifyNewHabit(habit: Habit, recorderName: string): void {
  void showOsNotification({
    title: `習慣: ${habit.name}`,
    body: [habit.body, `${recorderName}が追加`].filter(Boolean).join(" ／ "),
    tag: `habit-${habit.id}`,
    href: appPath("/habits"),
  });
}
