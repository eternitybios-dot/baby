import { Droplets, Milk, MoonStar, Utensils } from "lucide-react";
import type { TodaySummaryData } from "@/types/domain";
import { formatDurationMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";

interface TodaySummaryProps {
  summary: TodaySummaryData;
  className?: string;
}

export function TodaySummary({ summary, className }: TodaySummaryProps) {
  const items = [
    {
      key: "feeding",
      label: "授乳",
      value: `${summary.feedingCount}回`,
      icon: Utensils,
      tone: "bg-primary/25 text-primary-foreground",
    },
    {
      key: "formula",
      label: "ミルク",
      value: `${summary.formulaMl}ml`,
      icon: Milk,
      tone: "bg-accent/70 text-accent-foreground",
    },
    {
      key: "sleep",
      label: "睡眠",
      value: formatDurationMinutes(summary.sleepMinutes),
      icon: MoonStar,
      tone: "bg-secondary/45 text-secondary-foreground",
    },
    {
      key: "diaper",
      label: "おむつ",
      value: `${summary.diaperCount}回`,
      icon: Droplets,
      tone: "bg-muted text-foreground",
    },
  ] as const;

  return (
    <section
      className={cn("rounded-2xl bg-card p-4 shadow-soft", className)}
      aria-label="今日のサマリー"
    >
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">今日のまとめ</h2>
      <ul className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.key}
              className="flex items-center gap-3 rounded-xl bg-background/80 px-3 py-3"
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full",
                  item.tone,
                )}
                aria-hidden
              >
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-base font-semibold text-foreground">{item.value}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
