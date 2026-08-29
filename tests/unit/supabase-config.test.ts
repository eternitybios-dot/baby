import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SUPABASE_CONFIG_KEY,
  formatSupabaseConfigShareText,
  persistResolvedSupabaseConfig,
} from "@/lib/supabase/config";

describe("Supabase 接続情報の共有テキスト", () => {
  it("URL と anon key を相手へ貼れる形にする", () => {
    expect(
      formatSupabaseConfigShareText({
        url: "https://rgukivjlxvsddzbkkpyj.supabase.co",
        anonKey: "eyJhbGciOi-test",
      }),
    ).toBe(
      "Project URL\nhttps://rgukivjlxvsddzbkkpyj.supabase.co\n\nanon public key\neyJhbGciOi-test",
    );
  });
});

describe("接続情報の端末保管", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("環境変数の URL と anon key を localStorage に保管する", () => {
    const store = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    };
    vi.stubGlobal("localStorage", localStorage);
    vi.stubGlobal("window", { localStorage });
    const prevUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const prevKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://from-env.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "eyJenv";
    try {
      expect(persistResolvedSupabaseConfig()).toEqual({
        url: "https://from-env.supabase.co",
        anonKey: "eyJenv",
      });
      expect(store.get(SUPABASE_CONFIG_KEY)).toContain("https://from-env.supabase.co");
      expect(store.get(SUPABASE_CONFIG_KEY)).toContain("eyJenv");
    } finally {
      process.env.NEXT_PUBLIC_SUPABASE_URL = prevUrl;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = prevKey;
    }
  });

  it("localStorage の URL と anon key を保管して読み出せる", () => {
    const store = new Map<string, string>();
    const localStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    };
    vi.stubGlobal("localStorage", localStorage);
    vi.stubGlobal("window", { localStorage });
    store.set(
      SUPABASE_CONFIG_KEY,
      JSON.stringify({
        url: " https://example.supabase.co ",
        anonKey: " eyJanon ",
      }),
    );
    expect(persistResolvedSupabaseConfig()).toEqual({
      url: "https://example.supabase.co",
      anonKey: "eyJanon",
    });
    expect(store.get(SUPABASE_CONFIG_KEY)).toContain("https://example.supabase.co");
  });
});
