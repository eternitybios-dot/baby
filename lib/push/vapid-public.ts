/**
 * Web Push 用 VAPID 公開鍵のみ（秘密鍵は絶対に置かない）。
 *
 * 優先順位:
 * 1. ビルド時の NEXT_PUBLIC_VAPID_PUBLIC_KEY（GitHub Secrets）
 * 2. 下記フォールバック（Pages で Secrets 未設定でも購読できるようにする）
 *
 * 秘密鍵は Supabase Edge Secrets / GitHub Secrets のみ。ソースに書かない。
 */
const FALLBACK_VAPID_PUBLIC_KEY =
  "BGKEzBYqf0jTJPjqLSwhbldauPEKJo84WflF6c4bxtPpyCaTZbFRUjRZR6NF6MKMvQWxk8dmL87Pa9J8KtpK9zA";

export function getVapidPublicKey(): string {
  const fromEnv = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";
  return fromEnv || FALLBACK_VAPID_PUBLIC_KEY;
}

/** @deprecated getVapidPublicKey() を使ってください */
export const VAPID_PUBLIC_KEY = getVapidPublicKey();

export function hasVapidPublicKey(): boolean {
  return getVapidPublicKey().length > 0;
}
