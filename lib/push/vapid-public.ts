/** Web Push 用 VAPID 公開鍵（秘密鍵は Supabase Secrets のみ） */
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ||
  "BOGThgT-ThjwFpMvvfWN9_pfqLKfZo-f5w9A55bPRYTCaQVnJO9pDwMog1yz_9jYhUPIbeH-USlpYmlMEOnH8zk";
