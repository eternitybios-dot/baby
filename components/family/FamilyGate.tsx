"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppData } from "@/components/providers/AppDataProvider";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { APP_NAME } from "@/lib/constants";
import {
  getEnvSupabaseConfig,
  loadStoredSupabaseConfig,
} from "@/lib/supabase/config";
import { cn } from "@/lib/utils";

const DISPLAY_OPTIONS = ["ママ", "パパ"] as const;

export function FamilyGate() {
  const {
    bootPhase,
    bootError,
    syncing,
    saveSupabaseConfig,
    openConfig,
    createFamily,
    joinFamily,
    refresh,
  } = useAppData();

  const initialConfig = loadStoredSupabaseConfig() ?? getEnvSupabaseConfig();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [displayName, setDisplayName] = useState<string>("ママ");
  const [customName, setCustomName] = useState("");
  const [familyName, setFamilyName] = useState("わが家");
  const [babyName, setBabyName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState(initialConfig?.url ?? "");
  const [anonKey, setAnonKey] = useState(initialConfig?.anonKey ?? "");
  const [busy, setBusy] = useState(false);

  if (bootPhase === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center px-4">
        <LoadingState label="サーバーに接続しています…" />
      </div>
    );
  }

  if (bootPhase === "error") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4 py-8">
        <ErrorState
          title="接続に失敗しました"
          message={bootError ?? "設定を確認してください"}
          onRetry={() => void refresh()}
          action={
            <Button
              type="button"
              className="tap-target min-h-11 w-full max-w-xs"
              onClick={() => {
                const stored =
                  loadStoredSupabaseConfig() ?? getEnvSupabaseConfig();
                if (stored) {
                  setSupabaseUrl(stored.url);
                  setAnonKey(stored.anonKey);
                }
                openConfig();
              }}
            >
              設定をやり直す
            </Button>
          }
        />
        <p className="text-center text-xs text-muted-foreground">
          URL や anon key の打ち間違い、Anonymous 認証が OFF のことが多いです。
        </p>
      </div>
    );
  }

  if (bootPhase === "needs_config") {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-4 py-8">
        <header className="space-y-2 text-center">
          <p className="text-sm font-medium text-primary">{APP_NAME}</p>
          <h1 className="text-2xl font-bold tracking-tight">サーバー設定</h1>
          <p className="text-sm text-muted-foreground">
            夫婦で共有するため、Supabase の URL と anon key を入力します（各端末で1回）。
          </p>
        </header>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="sbUrl">Project URL</Label>
            <Input
              id="sbUrl"
              className="h-11"
              placeholder="https://xxxx.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="sbKey">anon public key</Label>
            <Input
              id="sbKey"
              className="h-11"
              placeholder="eyJhbGciOi..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              autoComplete="off"
            />
          </div>
          <Button
            type="button"
            className="tap-target h-11 w-full"
            disabled={busy}
            onClick={async () => {
              if (!supabaseUrl.trim() || !anonKey.trim()) {
                toast.error("URL と key を入力してください");
                return;
              }
              setBusy(true);
              try {
                await saveSupabaseConfig({
                  url: supabaseUrl.trim(),
                  anonKey: anonKey.trim(),
                });
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : "接続に失敗しました",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            接続する
          </Button>
          <p className="text-xs text-muted-foreground">
            手順は docs/SUPABASE_SETUP.md を参照してください。
          </p>
        </div>
      </div>
    );
  }

  if (bootPhase !== "needs_family") {
    return null;
  }

  const resolvedDisplayName =
    displayName === "その他" ? customName.trim() : displayName;

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-4 py-8">
      <header className="space-y-2 text-center">
        <p className="text-sm font-medium text-primary">{APP_NAME}</p>
        <h1 className="text-2xl font-bold tracking-tight">家族をつなぐ</h1>
        <p className="text-sm text-muted-foreground">
          どちらかが家族を作成し、もう一方は招待コードで参加します。
        </p>
      </header>

      <div className="flex gap-2">
        <button
          type="button"
          className={cn(
            "tap-target h-11 flex-1 rounded-xl border text-sm font-medium",
            mode === "create"
              ? "border-primary bg-primary/30"
              : "border-border bg-background",
          )}
          aria-pressed={mode === "create"}
          onClick={() => setMode("create")}
        >
          家族を作る
        </button>
        <button
          type="button"
          className={cn(
            "tap-target h-11 flex-1 rounded-xl border text-sm font-medium",
            mode === "join"
              ? "border-primary bg-primary/30"
              : "border-border bg-background",
          )}
          aria-pressed={mode === "join"}
          onClick={() => setMode("join")}
        >
          コードで参加
        </button>
      </div>

      <div className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
        <div className="space-y-2">
          <Label>あなたの表示名</Label>
          <div className="flex gap-2">
            {DISPLAY_OPTIONS.map((name) => (
              <button
                key={name}
                type="button"
                className={cn(
                  "tap-target h-11 flex-1 rounded-xl border text-sm font-medium",
                  displayName === name
                    ? "border-primary bg-primary/30"
                    : "border-border bg-background",
                )}
                onClick={() => setDisplayName(name)}
              >
                {name}
              </button>
            ))}
            <button
              type="button"
              className={cn(
                "tap-target h-11 flex-1 rounded-xl border text-sm font-medium",
                displayName === "その他"
                  ? "border-primary bg-primary/30"
                  : "border-border bg-background",
              )}
              onClick={() => setDisplayName("その他")}
            >
              その他
            </button>
          </div>
          {displayName === "その他" ? (
            <Input
              className="h-11"
              placeholder="表示名"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          ) : null}
        </div>

        {mode === "create" ? (
          <>
            <div className="space-y-1">
              <Label htmlFor="familyName">家族の名前</Label>
              <Input
                id="familyName"
                className="h-11"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="babyName">赤ちゃんの名前</Label>
              <Input
                id="babyName"
                className="h-11"
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="birthDate">生年月日</Label>
              <Input
                id="birthDate"
                type="date"
                className="h-11"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
            <Button
              type="button"
              className="tap-target h-11 w-full"
              disabled={busy || syncing}
              onClick={async () => {
                if (!resolvedDisplayName) {
                  toast.error("表示名を入力してください");
                  return;
                }
                if (!babyName.trim() || !birthDate) {
                  toast.error("赤ちゃんの名前と生年月日は必須です");
                  return;
                }
                setBusy(true);
                try {
                  await createFamily({
                    familyName: familyName.trim() || "わが家",
                    displayName: resolvedDisplayName,
                    babyName: babyName.trim(),
                    birthDate,
                  });
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "家族の作成に失敗しました",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              作成して始める
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <Label htmlFor="invite">招待コード</Label>
              <Input
                id="invite"
                className="h-11 uppercase tracking-[0.18em]"
                placeholder="10桁のコード"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                maxLength={12}
              />
            </div>
            <Button
              type="button"
              className="tap-target h-11 w-full"
              disabled={busy || syncing}
              onClick={async () => {
                if (!resolvedDisplayName) {
                  toast.error("表示名を入力してください");
                  return;
                }
                if (inviteCode.trim().length < 6) {
                  toast.error("招待コードを入力してください");
                  return;
                }
                setBusy(true);
                try {
                  await joinFamily({
                    inviteCode: inviteCode.trim(),
                    displayName: resolvedDisplayName,
                  });
                } catch (error) {
                  const raw =
                    error instanceof Error ? error.message : "参加に失敗しました";
                  const lower = raw.toLowerCase();
                  toast.error(
                    lower.includes("expired")
                      ? "招待コードの期限が切れています。再発行してもらってください"
                      : lower.includes("too many")
                        ? "参加の試行が多すぎます。しばらく待ってください"
                        : lower.includes("invalid")
                          ? "招待コードが違います"
                          : raw,
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              参加する
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
