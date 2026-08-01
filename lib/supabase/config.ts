export const SUPABASE_CONFIG_KEY = "sukusuku-supabase-config";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getEnvSupabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  if (url && anonKey) return { url, anonKey };
  return null;
}

export function loadStoredSupabaseConfig(): SupabaseConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SupabaseConfig;
    if (parsed?.url?.trim() && parsed?.anonKey?.trim()) {
      return { url: parsed.url.trim(), anonKey: parsed.anonKey.trim() };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function saveStoredSupabaseConfig(config: SupabaseConfig): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    SUPABASE_CONFIG_KEY,
    JSON.stringify({
      url: config.url.trim(),
      anonKey: config.anonKey.trim(),
    }),
  );
}

export function clearStoredSupabaseConfig(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SUPABASE_CONFIG_KEY);
}

/** 端末に保存した設定を優先し、なければビルド時の環境変数を使う */
export function resolveSupabaseConfig(): SupabaseConfig | null {
  return loadStoredSupabaseConfig() ?? getEnvSupabaseConfig();
}
