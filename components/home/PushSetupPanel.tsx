"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadStoredSupabaseConfig } from "@/lib/supabase/config";
import { VAPID_PUBLIC_KEY } from "@/lib/push/vapid-public";

const VAPID_PRIVATE_KEY = "KZAhV4989qRnmm87TVvnlFaD2mAtk_bX-1F-cn2aL3s";
const SQL_003_URL =
  "https://raw.githubusercontent.com/eternitybios-dot/baby/cursor/sukusuku-log-foundation-814d/supabase/migrations/003_push_subscriptions.sql";
const FN_URL =
  "https://raw.githubusercontent.com/eternitybios-dot/baby/cursor/sukusuku-log-foundation-814d/supabase/functions/notify-family/index.ts";

function projectRefFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname; // xxx.supabase.co
    return host.replace(".supabase.co", "");
  } catch {
    return "";
  }
}

async function copyText(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label}をコピーしました`);
  } catch {
    toast.error("コピーできませんでした");
  }
}

export function PushSetupPanel() {
  const [ref, setRef] = useState(() => {
    const stored = loadStoredSupabaseConfig();
    return stored?.url ? projectRefFromUrl(stored.url) : "";
  });
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState("");

  const dashboardFunctions = ref
    ? `https://supabase.com/dashboard/project/${ref}/functions`
    : "https://supabase.com/dashboard";
  const dashboardSecrets = ref
    ? `https://supabase.com/dashboard/project/${ref}/settings/functions`
    : "https://supabase.com/dashboard";
  const dashboardSql = ref
    ? `https://supabase.com/dashboard/project/${ref}/sql/new`
    : "https://supabase.com/dashboard";

  const runAutoDeploy = async () => {
    if (!ref.trim()) {
      toast.error("Project Ref を入力してください");
      return;
    }
    if (!token.trim().startsWith("sbp_")) {
      toast.error("Access Token（sbp_ で始まる）を入力してください");
      return;
    }
    setBusy(true);
    setLog("開始...\n");
    const append = (line: string) =>
      setLog((prev) => `${prev}${line}\n`);

    try {
      // 1) Secrets
      append("Secrets を設定中...");
      const secretsRes = await fetch(
        `https://api.supabase.com/v1/projects/${ref.trim()}/secrets`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            { name: "VAPID_PUBLIC_KEY", value: VAPID_PUBLIC_KEY },
            { name: "VAPID_PRIVATE_KEY", value: VAPID_PRIVATE_KEY },
            { name: "VAPID_SUBJECT", value: "mailto:sukusuku@localhost" },
          ]),
        },
      );
      const secretsText = await secretsRes.text();
      if (!secretsRes.ok) {
        throw new Error(`Secrets失敗: ${secretsRes.status} ${secretsText}`);
      }
      append("✓ Secrets OK");

      // 2) Fetch function source then deploy
      append("関数コードを取得中...");
      const fnRes = await fetch(FN_URL);
      if (!fnRes.ok) throw new Error("関数コードの取得に失敗");
      const source = await fnRes.text();

      append("Edge Function をデプロイ中...");
      const form = new FormData();
      form.append(
        "metadata",
        JSON.stringify({
          name: "notify-family",
          entrypoint_path: "index.ts",
          verify_jwt: true,
        }),
      );
      form.append(
        "file",
        new Blob([source], { type: "application/typescript" }),
        "index.ts",
      );
      const deployRes = await fetch(
        `https://api.supabase.com/v1/projects/${ref.trim()}/functions/deploy?slug=notify-family`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token.trim()}` },
          body: form,
        },
      );
      const deployText = await deployRes.text();
      if (!deployRes.ok) {
        throw new Error(`デプロイ失敗: ${deployRes.status} ${deployText}`);
      }
      append("✓ notify-family デプロイ OK");
      append("");
      append("完了！両方の端末で「通知をオン」し直してください。");
      append("（まだなら SQL 003 も実行）");
      toast.success("通知サーバーのセットアップが完了しました");
      setToken("");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      append(`エラー: ${message}`);
      if (message.toLowerCase().includes("failed to fetch")) {
        append("");
        append(
          "ブラウザから api.supabase.com へ直接送れない場合があります。下の手動手順か、チャットに Access Token を貼ってください。",
        );
      }
      toast.error("自動セットアップに失敗しました");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
      <h2 className="text-sm font-medium text-muted-foreground">
        通知サーバーセットアップ（1回だけ）
      </h2>
      <p className="text-xs text-muted-foreground">
        iPhone でアプリを閉じているときにも通知を届けるための設定です。PCだと楽です。
      </p>

      <div className="space-y-1">
        <Label htmlFor="projectRef">Project Ref</Label>
        <Input
          id="projectRef"
          className="h-11 font-mono text-sm"
          placeholder="abcdxyzxyzxyzxyz"
          value={ref}
          onChange={(e) => setRef(e.target.value.trim())}
        />
        <p className="text-[11px] text-muted-foreground">
          Project URL が https://abcd.supabase.co なら abcd の部分
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="accessToken">Access Token</Label>
        <Input
          id="accessToken"
          className="h-11 font-mono text-sm"
          type="password"
          autoComplete="off"
          placeholder="sbp_..."
          value={token}
          onChange={(e) => setToken(e.target.value.trim())}
        />
        <a
          className="text-xs font-medium text-primary underline"
          href="https://supabase.com/dashboard/account/tokens"
          target="_blank"
          rel="noreferrer"
        >
          トークン作成ページを開く
        </a>
        <p className="text-[11px] text-muted-foreground">
          「Generate new token」→ 名前は何でもOK → 作った sbp_... を貼る（この端末にだけ一時入力）
        </p>
      </div>

      <Button
        type="button"
        className="tap-target h-11 w-full"
        disabled={busy}
        onClick={() => void runAutoDeploy()}
      >
        {busy ? "セットアップ中…" : "自動で作成する"}
      </Button>

      {log ? (
        <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-background p-3 text-[11px] text-muted-foreground">
          {log}
        </pre>
      ) : null}

      <div className="space-y-2 border-t border-border pt-3">
        <p className="text-xs font-medium">うまくいかないとき（手動）</p>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="tap-target h-10 justify-start"
            onClick={() => window.open(dashboardSql, "_blank")}
          >
            1. SQL Editor を開く
          </Button>
          <Button
            type="button"
            variant="outline"
            className="tap-target h-10 justify-start"
            onClick={() => void copyText("SQLのURL", SQL_003_URL)}
          >
            2. SQL（003）のURLをコピー
          </Button>
          <Button
            type="button"
            variant="outline"
            className="tap-target h-10 justify-start"
            onClick={() => window.open(dashboardFunctions, "_blank")}
          >
            3. Edge Functions を開く
          </Button>
          <Button
            type="button"
            variant="outline"
            className="tap-target h-10 justify-start"
            onClick={() => void copyText("関数コードのURL", FN_URL)}
          >
            4. 関数コードのURLをコピー
          </Button>
          <Button
            type="button"
            variant="outline"
            className="tap-target h-10 justify-start"
            onClick={() => window.open(dashboardSecrets, "_blank")}
          >
            5. Secrets ページを開く
          </Button>
          <Button
            type="button"
            variant="outline"
            className="tap-target h-10 justify-start"
            onClick={() =>
              void copyText(
                "Secrets用テキスト",
                [
                  `VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}`,
                  `VAPID_PRIVATE_KEY=${VAPID_PRIVATE_KEY}`,
                  "VAPID_SUBJECT=mailto:sukusuku@localhost",
                ].join("\n"),
              )
            }
          >
            6. Secrets 3つをコピー
          </Button>
        </div>
      </div>
    </section>
  );
}
