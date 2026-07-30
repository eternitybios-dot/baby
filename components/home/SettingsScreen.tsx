"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Baby,
  Bell,
  ChevronRight,
  Copy,
  HeartHandshake,
  LineChart,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppData } from "@/components/providers/AppDataProvider";
import { APP_NAME } from "@/lib/constants";
import {
  disableNotifications,
  enableNotifications,
  getNotificationPermission,
  getNotificationPref,
  isNotificationSupported,
} from "@/lib/notifications";
import { cn } from "@/lib/utils";

const LINKS = [
  {
    href: "/growth",
    label: "成長記録",
    description: "体重・身長・頭囲",
    icon: LineChart,
  },
  {
    href: "/concerns",
    label: "困り事",
    description: "気になることと対応",
    icon: HeartHandshake,
  },
  {
    href: "/habits",
    label: "習慣・クセ",
    description: "サインと効いた対応",
    icon: Sparkles,
  },
  {
    href: "/records",
    label: "記録一覧",
    description: "タイムラインをまとめて見る",
    icon: Baby,
  },
] as const;

export function SettingsScreen() {
  const {
    baby,
    state,
    currentUser,
    syncing,
    updateBaby,
    updateDisplayName,
  } = useAppData();
  const [name, setName] = useState(baby.name);
  const [nickname, setNickname] = useState(baby.nickname ?? "");
  const [birthDate, setBirthDate] = useState(baby.birthDate);
  const [memo, setMemo] = useState(baby.memo ?? "");
  const [displayNameDraft, setDisplayNameDraft] = useState<string | null>(null);
  const displayName = displayNameDraft ?? currentUser.displayName;
  const [notifyOn, setNotifyOn] = useState(() => getNotificationPref());
  const notifySupported = isNotificationSupported();
  const notifyPermission = getNotificationPermission();

  // サーバー同期で赤ちゃんが差し替わったときだけフォームを揃える
  const babyFormKey = `${baby.id}:${baby.name}:${baby.birthDate}`;
  const [formKey, setFormKey] = useState(babyFormKey);
  if (formKey !== babyFormKey) {
    setFormKey(babyFormKey);
    setName(baby.name);
    setNickname(baby.nickname ?? "");
    setBirthDate(baby.birthDate);
    setMemo(baby.memo ?? "");
  }

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">設定</h1>
        <p className="text-sm text-muted-foreground">{APP_NAME}</p>
      </header>

      <section className="rounded-2xl bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2 text-muted-foreground">
          <Bell className="size-4" aria-hidden />
          <h2 className="text-sm font-medium">困り事の通知</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          相手が困り事を追加したとき、画面上の通知と（許可すれば）端末の通知を出します。
        </p>
        {!notifySupported ? (
          <p className="mt-3 text-sm text-muted-foreground">
            このブラウザは通知に対応していません。
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            <button
              type="button"
              className={cn(
                "tap-target flex h-11 w-full items-center justify-center rounded-xl border text-sm font-medium",
                notifyOn && notifyPermission === "granted"
                  ? "border-primary bg-primary/30"
                  : "border-border bg-background",
              )}
              aria-pressed={notifyOn && notifyPermission === "granted"}
              onClick={async () => {
                if (notifyOn && notifyPermission === "granted") {
                  disableNotifications();
                  setNotifyOn(false);
                  toast.message("通知をオフにしました");
                  return;
                }
                const ok = await enableNotifications();
                setNotifyOn(ok);
                if (ok) {
                  toast.success("通知をオンにしました");
                } else if (notifyPermission === "denied" || getNotificationPermission() === "denied") {
                  toast.error(
                    "通知がブロックされています。ブラウザのサイト設定から許可してください",
                  );
                } else {
                  toast.error("通知を許可できませんでした");
                }
              }}
            >
              {notifyOn && notifyPermission === "granted"
                ? "通知オン（タップでオフ）"
                : "通知をオンにする"}
            </button>
            {notifyPermission === "denied" ? (
              <p className="text-xs text-destructive">
                ブラウザで通知が拒否されています。設定アプリ／サイト設定から変更してください。
              </p>
            ) : null}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2 text-muted-foreground">
          <Users className="size-4" aria-hidden />
          <h2 className="text-sm font-medium">家族の共有</h2>
        </div>
        <p className="text-sm font-semibold">{state.family.familyName}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          相手の端末でも同じ招待コードで参加すると、記録がサーバー経由で共有されます。
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 rounded-xl border border-border bg-background px-3 py-2">
            <p className="text-[11px] text-muted-foreground">招待コード</p>
            <p className="font-mono text-lg tracking-[0.25em]">
              {state.family.inviteCode || "------"}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="tap-target h-11 shrink-0"
            aria-label="招待コードをコピー"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(state.family.inviteCode);
                toast.success("招待コードをコピーしました");
              } catch {
                toast.error("コピーできませんでした");
              }
            }}
          >
            <Copy className="size-4" />
          </Button>
        </div>
        <ul className="mt-3 space-y-1 text-sm">
          {state.family.members.map((member) => (
            <li key={member.id} className="flex items-center justify-between">
              <span>{member.displayName}</span>
              <span className="text-xs text-muted-foreground">
                {member.id === currentUser.id
                  ? "この端末"
                  : member.role === "owner"
                    ? "作成者"
                    : "メンバー"}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
        <h2 className="text-sm font-medium text-muted-foreground">あなたの表示名</h2>
        <Input
          className="h-11"
          value={displayName}
          onChange={(e) => setDisplayNameDraft(e.target.value)}
          aria-label="表示名"
        />
        <Button
          type="button"
          variant="outline"
          className="tap-target h-11 w-full"
          disabled={syncing}
          onClick={async () => {
            await updateDisplayName(displayName);
            setDisplayNameDraft(null);
          }}
        >
          表示名を保存
        </Button>
      </section>

      <section className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Baby className="size-4" aria-hidden />
          <h2 className="text-sm font-medium">赤ちゃん情報</h2>
        </div>
        <div className="space-y-1">
          <Label htmlFor="babyName">名前</Label>
          <Input
            id="babyName"
            className="h-11"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="babyNickname">ニックネーム</Label>
          <Input
            id="babyNickname"
            className="h-11"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="babyBirth">生年月日</Label>
          <Input
            id="babyBirth"
            type="date"
            className="h-11"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="babyMemo">メモ</Label>
          <Input
            id="babyMemo"
            className="h-11"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>
        <Button
          type="button"
          className="tap-target h-11 w-full"
          aria-label="赤ちゃん情報を保存"
          disabled={syncing}
          onClick={() => {
            if (!name.trim() || !birthDate) {
              toast.error("名前と生年月日は必須です");
              return;
            }
            updateBaby({
              name: name.trim(),
              nickname: nickname.trim() || null,
              birthDate,
              memo: memo.trim() || null,
              avatarUrl: null,
            });
            toast.success("赤ちゃん情報を保存しました");
          }}
        >
          保存する
        </Button>
      </section>

      <nav className="space-y-2" aria-label="設定メニュー">
        {LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="tap-target flex min-h-14 items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
              aria-label={link.label}
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/25 text-primary-foreground">
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{link.label}</span>
                <span className="block text-xs text-muted-foreground">
                  {link.description}
                </span>
              </span>
              <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
