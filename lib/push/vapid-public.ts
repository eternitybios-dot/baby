/**
 * Web Push 用 VAPID 公開鍵のみ（秘密鍵は絶対に置かない）。
 * ビルド時に NEXT_PUBLIC_VAPID_PUBLIC_KEY を渡す。
 */
export function getVapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";
}

/** @deprecated getVapidPublicKey() を使ってください */
export const VAPID_PUBLIC_KEY = getVapidPublicKey();

export function hasVapidPublicKey(): boolean {
  return getVapidPublicKey().length > 0;
}
