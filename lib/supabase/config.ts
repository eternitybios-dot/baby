export const SUPABASE_CONFIG_KEY = "sukusuku-supabase-config";
export const SUPABASE_CONFIG_CHANGED_EVENT = "sukusuku-supabase-config-changed";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

function notifySupabaseConfigChanged(): void {
  if (typeof window === "undefined") return;
  if (typeof window.dispatchEvent !== "function") return;
  if (typeof Event === "undefined") return;
  window.dispatchEvent(new Event(SUPABASE_CONFIG_CHANGED_EVENT));
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
  notifySupabaseConfigChanged();
}

export function clearStoredSupabaseConfig(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SUPABASE_CONFIG_KEY);
  notifySupabaseConfigChanged();
}

export function subscribeSupabaseConfig(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => onStoreChange();
  window.addEventListener(SUPABASE_CONFIG_CHANGED_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(SUPABASE_CONFIG_CHANGED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}

/** useSyncExternalStore 用。同じ内容なら同じ文字列を返す */
export function getSupabaseConfigSnapshot(): string {
  const config = resolveSupabaseConfig();
  if (!config) return "";
  return JSON.stringify({
    url: config.url.trim(),
    anonKey: config.anonKey.trim(),
  });
}

export function getSupabaseConfigServerSnapshot(): string {
  return "";
}

/** 端末に保存した設定を優先し、なければビルド時の環境変数を使う */
export function resolveSupabaseConfig(): SupabaseConfig | null {
  return loadStoredSupabaseConfig() ?? getEnvSupabaseConfig();
}

/** 相手の端末に貼る用 */
export function formatSupabaseConfigShareText(config: SupabaseConfig): string {
  return `Project URL\n${config.url.trim()}\n\nanon public key\n${config.anonKey.trim()}`;
}

/** 解決した接続情報をこの端末の localStorage に保管する */
export function persistResolvedSupabaseConfig(): SupabaseConfig | null {
  const config = resolveSupabaseConfig();
  if (!config) return null;
  saveStoredSupabaseConfig(config);
  return {
    url: config.url.trim(),
    anonKey: config.anonKey.trim(),
  };
}
