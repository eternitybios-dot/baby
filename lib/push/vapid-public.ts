/**
 * Web Push 用 VAPID 公開鍵のみ（秘密鍵は絶対に置かない）。
 *
 * 優先順位:
 * 1. ビルド時の NEXT_PUBLIC_VAPID_PUBLIC_KEY（GitHub Secrets）
 *    ※ Edge に未反映の回転済み鍵は無視する
 * 2. 下記フォールバック（Pages で Secrets 未設定でも購読できるようにする）
 *
 * 秘密鍵は Supabase Edge Secrets / GitHub Secrets のみ。ソースに書かない。
 *
 * 重要: この公開鍵は Edge Function に設定済みの秘密鍵と**同じペア**であること。
 * ペアがずれると「相手への通知が送れませんでした」になる。
 *
 * 現在のフォールバックは、本番 Edge に入っている鍵ペア（初回デプロイ時）に合わせている。
 */
const FALLBACK_VAPID_PUBLIC_KEY =
  "BOGThgT-ThjwFpMvvfWN9_pfqLKfZo-f5w9A55bPRYTCaQVnJO9pDwMog1yz_9jYhUPIbeH-USlpYmlMEOnH8zk";

/**
 * Edge Secrets へ反映されないままクライアントだけ更新してしまった公開鍵。
 * これらを使うと購読はできても送信がすべて失敗する。
 */
const UNDEPLOYED_PUBLIC_KEYS = new Set([
  // 2026-08-02 回転案（Pages には載ったが Edge 秘密鍵は更新されず）
  "BGKEzBYqf0jTJPjqLSwhbldauPEKJo84WflF6c4bxtPpyCaTZbFRUjRZR6NF6MKMvQWxk8dmL87Pa9J8KtpK9zA",
  // 中間生成キー（未使用）
  "BPzsQN4E9-LaOTrrRLBtMNVuPA0QIiIhQO_oIN6fh6w9bXnkiamNwxWFc5MsgIsw10_FqYSicNL6j_VgdhvSwPo",
]);

/** 購読の作り直し判定用。鍵を変えたら必ず更新する */
export const VAPID_PUBLIC_KEY_ID = "bogthgt-edge-matched-20260802";

export function getVapidPublicKey(): string {
  const fromEnv = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || "";
  if (fromEnv && !UNDEPLOYED_PUBLIC_KEYS.has(fromEnv)) return fromEnv;
  return FALLBACK_VAPID_PUBLIC_KEY;
}

/** @deprecated getVapidPublicKey() を使ってください */
export const VAPID_PUBLIC_KEY = getVapidPublicKey();

export function hasVapidPublicKey(): boolean {
  return getVapidPublicKey().length > 0;
}
