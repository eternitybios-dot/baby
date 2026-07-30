"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Baby,
  ChevronRight,
  HeartHandshake,
  LineChart,
  RotateCcw,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppData } from "@/components/providers/AppDataProvider";
import { APP_NAME } from "@/lib/constants";
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
    setCurrentUser,
    updateBaby,
    resetDemoData,
  } = useAppData();
  const [name, setName] = useState(baby.name);
  const [nickname, setNickname] = useState(baby.nickname ?? "");
  const [birthDate, setBirthDate] = useState(baby.birthDate);
  const [memo, setMemo] = useState(baby.memo ?? "");

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">設定</h1>
        <p className="text-sm text-muted-foreground">{APP_NAME}</p>
      </header>

      <section className="rounded-2xl bg-card p-4 shadow-soft">
        <div className="mb-3 flex items-center gap-2 text-muted-foreground">
          <Users className="size-4" aria-hidden />
          <h2 className="text-sm font-medium">いまの記録者</h2>
        </div>
        <div className="flex gap-2">
          {state.family.members.map((member) => {
            const selected = member.id === currentUser.id;
            return (
              <button
                key={member.id}
                type="button"
                className={cn(
                  "tap-target h-11 flex-1 rounded-xl border text-sm font-medium",
                  selected
                    ? "border-primary bg-primary/30 text-primary-foreground"
                    : "border-border bg-background",
                )}
                aria-label={`${member.displayName}として記録`}
                aria-pressed={selected}
                onClick={() => {
                  setCurrentUser(member.id);
                  toast.success(`${member.displayName}に切り替えました`);
                }}
              >
                {member.displayName}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          家族: {state.family.familyName}（認証なし・この端末に保存）
        </p>
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

      <Button
        type="button"
        variant="outline"
        className="tap-target flex h-12 w-full items-center justify-center gap-2"
        aria-label="初期データに戻す"
        onClick={() => {
          resetDemoData();
          toast.success("初期データに戻しました");
        }}
      >
        <RotateCcw className="size-4" aria-hidden />
        初期データに戻す
      </Button>
    </div>
  );
}
