import Link from "next/link";
import {
  Baby,
  ChevronRight,
  HeartHandshake,
  LineChart,
  Sparkles,
} from "lucide-react";
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

interface MoreLinksProps {
  className?: string;
  title?: string;
}

export function MoreLinks({
  className,
  title = "その他の記録",
}: MoreLinksProps) {
  return (
    <nav className={cn("space-y-2", className)} aria-label={title}>
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
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
  );
}
