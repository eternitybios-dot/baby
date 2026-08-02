import { afterEach, describe, expect, it, vi } from "vitest";

describe("VAPID 公開鍵の解決", () => {
  const ORIGINAL = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  afterEach(() => {
    if (ORIGINAL === undefined) {
      delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    } else {
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = ORIGINAL;
    }
    vi.resetModules();
  });

  it("Edge 未反映の回転済み公開鍵は無視してフォールバックを使う", async () => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY =
      "BGKEzBYqf0jTJPjqLSwhbldauPEKJo84WflF6c4bxtPpyCaTZbFRUjRZR6NF6MKMvQWxk8dmL87Pa9J8KtpK9zA";
    const { getVapidPublicKey } = await import("@/lib/push/vapid-public");
    expect(getVapidPublicKey().startsWith("BOGThgT")).toBe(true);
  });

  it("未設定なら Edge 一致のフォールバックを使う", async () => {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const { getVapidPublicKey } = await import("@/lib/push/vapid-public");
    expect(getVapidPublicKey().startsWith("BOGThgT")).toBe(true);
  });
});
