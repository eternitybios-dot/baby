#!/usr/bin/env node
/**
 * notify-family Edge Function のデプロイ + VAPID Secrets 設定
 *
 * 使い方:
 *   SUPABASE_ACCESS_TOKEN=sbp_xxx \
 *   SUPABASE_PROJECT_REF=abcdefghijklmnop \
 *   node scripts/deploy-notify-family.mjs
 *
 * Project Ref は Project URL の https://<REF>.supabase.co の <REF>
 * Access Token は https://supabase.com/dashboard/account/tokens で作成
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const PROJECT_REF = (
  process.env.SUPABASE_PROJECT_REF ||
  process.env.SUPABASE_PROJECT_ID ||
  ""
).trim();

const VAPID_PUBLIC_KEY =
  process.env.VAPID_PUBLIC_KEY?.trim() ||
  "BOGThgT-ThjwFpMvvfWN9_pfqLKfZo-f5w9A55bPRYTCaQVnJO9pDwMog1yz_9jYhUPIbeH-USlpYmlMEOnH8zk";
const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY?.trim() ||
  "KZAhV4989qRnmm87TVvnlFaD2mAtk_bX-1F-cn2aL3s";
const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT?.trim() || "mailto:sukusuku@localhost";

if (!ACCESS_TOKEN) {
  console.error("SUPABASE_ACCESS_TOKEN がありません。");
  console.error(
    "https://supabase.com/dashboard/account/tokens で Personal Access Token を作成してください。",
  );
  process.exit(1);
}
if (!PROJECT_REF) {
  console.error("SUPABASE_PROJECT_REF がありません。");
  console.error("例: https://abcdxyz.supabase.co → abcdxyz");
  process.exit(1);
}

const functionPath = resolve(
  root,
  "supabase/functions/notify-family/index.ts",
);
if (!existsSync(functionPath)) {
  console.error("関数ファイルが見つかりません:", functionPath);
  process.exit(1);
}

const source = readFileSync(functionPath, "utf8");
const api = `https://api.supabase.com/v1/projects/${PROJECT_REF}`;

async function apiFetch(path, init = {}) {
  const res = await fetch(`${api}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(
      `${init.method || "GET"} ${path} → ${res.status}: ${text}`,
    );
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

async function setSecrets() {
  console.log("→ VAPID Secrets を設定中...");
  await apiFetch("/secrets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify([
      { name: "VAPID_PUBLIC_KEY", value: VAPID_PUBLIC_KEY },
      { name: "VAPID_PRIVATE_KEY", value: VAPID_PRIVATE_KEY },
      { name: "VAPID_SUBJECT", value: VAPID_SUBJECT },
    ]),
  });
  console.log("✓ Secrets 設定完了");
}

async function deployFunction() {
  console.log("→ Edge Function notify-family をデプロイ中...");
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

  const res = await fetch(
    `${api}/functions/deploy?slug=notify-family`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
      body: form,
    },
  );
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`deploy failed ${res.status}: ${text}`);
  }
  console.log("✓ Edge Function デプロイ完了");
  try {
    console.log(JSON.stringify(JSON.parse(text), null, 2));
  } catch {
    console.log(text);
  }
}

async function ensureSqlHint() {
  console.log("");
  console.log("まだなら SQL も実行してください:");
  console.log(
    "https://raw.githubusercontent.com/eternitybios-dot/baby/cursor/sukusuku-log-foundation-814d/supabase/migrations/003_push_subscriptions.sql",
  );
}

async function main() {
  console.log(`Project: ${PROJECT_REF}`);
  await setSecrets();
  await deployFunction();
  await ensureSqlHint();
  console.log("");
  console.log("完了。両方の iPhone で「設定 → 通知をオン」し直してください。");
}

main().catch((error) => {
  console.error("失敗:", error.message || error);
  process.exit(1);
});
