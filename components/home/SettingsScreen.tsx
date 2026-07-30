import Link from "next/link";
import {
  Baby,
  ChevronRight,
  HeartHandshake,
  LineChart,
  LogOut,
  Sparkles,
  Users,
} from "lucide-react";
import { ErrorState } from "@/components/shared/ErrorState";
import { fetchBaby, fetchFamilySettings } from "@/lib/data/queries";
import { loadViewData } from "@/lib/data/load";
import { APP_NAME } from "@/lib/constants";

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

export async function SettingsScreen() {
  const state = await loadViewData(async () => {
    const [baby, family] = await Promise.all([
      fetchBaby(),
      fetchFamilySettings(),
    ]);
    return { baby, family };
  });

  if (state.status === "error") {
    return <ErrorState message={state.message} />;
  }

  const { baby, family } = state.data;

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">設定</h1>
        <p className="text-sm text-muted-foreground">{APP_NAME}</p>
      </header>

      <section className="rounded-2xl bg-card p-4 shadow-soft">
        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
          <Users className="size-4" aria-hidden />
          <h2 className="text-sm font-medium">家族</h2>
        </div>
        <p className="text-base font-semibold">{family.familyName}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          招待コード:{" "}
          <span className="font-medium text-foreground">{family.inviteCode}</span>
        </p>
        <ul className="mt-3 space-y-1">
          {family.members.map((member) => (
            <li key={member.id} className="text-sm text-foreground">
              {member.displayName}
              <span className="text-muted-foreground">
                （{member.role === "owner" ? "オーナー" : "メンバー"}）
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-card p-4 shadow-soft">
        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
          <Baby className="size-4" aria-hidden />
          <h2 className="text-sm font-medium">赤ちゃん</h2>
        </div>
        <p className="text-base font-semibold">{baby.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          生年月日 {baby.birthDate}
          {baby.nickname ? ` ／ ${baby.nickname}` : ""}
        </p>
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

      <button
        type="button"
        className="tap-target flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-medium text-muted-foreground shadow-soft"
        aria-label="ログアウト（デモ）"
      >
        <LogOut className="size-4" aria-hidden />
        ログアウト（デモ）
      </button>
    </div>
  );
}
