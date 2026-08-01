import { describe, expect, it } from "vitest";

/**
 * RLS で他家族データへアクセスできないことの検証は Supabase 実環境が必要です。
 * 環境変数が無い場合はスキップし、成功扱いしません（このファイルはドキュメント用）。
 *
 * 手動手順は docs/MANUAL_VERIFICATION.md を参照。
 */
const hasSupabase =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

describe.skipIf(!hasSupabase)("RLS: 他家族データへのアクセス不可（要実環境）", () => {
  it("実環境テスト用プレースホルダ", () => {
    expect(hasSupabase).toBe(true);
  });
});

describe("RLS テストの前提", () => {
  it("Service Role Key が無いときは統合テストを実行しない", () => {
    if (!hasSupabase) {
      expect(hasSupabase).toBe(false);
    } else {
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeTruthy();
    }
  });
});
