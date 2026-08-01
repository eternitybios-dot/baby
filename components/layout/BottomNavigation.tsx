"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  Home,
  Plus,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationProps {
  onRecordPress: () => void;
}

/** 中央の大きな記録ボタンを挟む左右タブ（合計5項目） */
const leftItems = [
  { href: "/home", label: "ホーム", icon: Home },
  { href: "/calendar", label: "カレンダー", icon: CalendarDays },
] as const;

const rightItems = [
  { href: "/charts", label: "グラフ", icon: BarChart3 },
  { href: "/settings", label: "設定", icon: Settings },
] as const;

function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof Home;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href);

  return (
    <Link
      href={href}
      className={cn(
        "tap-target flex min-w-[3.5rem] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1.5 text-[11px] font-medium transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
      aria-label={label}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-full",
          active ? "bg-primary/35 text-primary-foreground" : "bg-transparent",
        )}
      >
        <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} />
      </span>
      {label}
    </Link>
  );
}

export function BottomNavigation({ onRecordPress }: BottomNavigationProps) {
  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
      aria-label="メインナビゲーション"
    >
      <div className="app-max-width pointer-events-auto px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="relative flex items-end justify-between gap-1 rounded-3xl border border-border/80 bg-card/95 px-1 pb-2 pt-2 shadow-soft backdrop-blur">
          <div className="flex flex-1 justify-around">
            {leftItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>

          <div className="relative -mt-7 flex w-[4.75rem] shrink-0 flex-col items-center">
            <button
              type="button"
              onClick={onRecordPress}
              className="flex size-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft ring-4 ring-background transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50"
              aria-label="記録"
            >
              <Plus className="size-8" strokeWidth={2.25} />
            </button>
            <span className="mt-1 text-[11px] font-medium text-foreground">
              記録
            </span>
          </div>

          <div className="flex flex-1 justify-around">
            {rightItems.map((item) => (
              <NavLink key={item.href} {...item} />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
