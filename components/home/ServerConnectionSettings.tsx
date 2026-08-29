"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Copy, Server } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyToClipboard } from "@/lib/clipboard";
import {
  formatSupabaseConfigShareText,
  getSupabaseConfigServerSnapshot,
  getSupabaseConfigSnapshot,
  persistResolvedSupabaseConfig,
  subscribeSupabaseConfig,
  type SupabaseConfig,
} from "@/lib/supabase/config";

function subscribeNever(): () => void {
  return () => {};
}

function getClientTrue(): boolean {
  return true;
}

function getServerFalse(): boolean {
  return false;
}

export function ServerConnectionSettings() {
  const clientReady = useSyncExternalStore(
    subscribeNever,
    getClientTrue,
    getServerFalse,
  );
  const serverConfigJson = useSyncExternalStore(
    subscribeSupabaseConfig,
    getSupabaseConfigSnapshot,
    getSupabaseConfigServerSnapshot,
  );
  const serverConfig = serverConfigJson
    ? (JSON.parse(serverConfigJson) as SupabaseConfig)
    : null;

  useEffect(() => {
    persistResolvedSupabaseConfig();
  }, []);

  return (
    <section className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="mb-3 flex items-center gap-2 text-muted-foreground">
        <Server className="size-4" aria-hidden />
        <h2 className="text-sm font-medium">サーバー接続</h2>
      </div>
      <p className="text-xs text-muted-foreground">
        この端末に保管している接続情報です。相手のスマホの「サーバー設定」に貼ってください。
      </p>
      {!clientReady ? (
        <p className="mt-3 text-sm text-muted-foreground">読み込み中…</p>
      ) : serverConfig ? (
        <div className="mt-3 space-y-3">
          <CopyableSecret
            label="Project URL"
            value={serverConfig.url}
            copiedLabel="Project URLをコピーしました"
          />
          <CopyableSecret
            label="anon public key"
            value={serverConfig.anonKey}
            copiedLabel="anon public keyをコピーしました"
          />
          <Button
            type="button"
            variant="outline"
            className="tap-target h-11 w-full"
            onClick={async () => {
              const ok = await copyToClipboard(
                formatSupabaseConfigShareText(serverConfig),
              );
              if (ok) toast.success("URLとkeyをコピーしました");
              else toast.error("コピーできませんでした");
            }}
          >
            URLとkeyをまとめてコピー
          </Button>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          この端末にサーバー設定がありません。「サーバー設定をやり直す」から入れ直してください。
        </p>
      )}
    </section>
  );
}

function CopyableSecret({
  label,
  value,
  copiedLabel,
}: {
  label: string;
  value: string;
  copiedLabel: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="break-all font-mono text-xs leading-relaxed">{value}</p>
      </div>
      <Button
        type="button"
        variant="outline"
        className="tap-target h-11 shrink-0"
        aria-label={`${label}をコピー`}
        onClick={async () => {
          const ok = await copyToClipboard(value);
          if (ok) toast.success(copiedLabel);
          else toast.error("コピーできませんでした");
        }}
      >
        <Copy className="size-4" />
      </Button>
    </div>
  );
}
