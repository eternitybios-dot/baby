import { Droplets, Milk, MoonStar, Utensils } from "lucide-react";
import type { TodaySummaryData } from "@/types/domain";
import { formatDurationMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";

interface DaySummaryChipsProps {
  summary: TodaySummaryData;
  className?: string;
}

export function DaySummaryChips({ summary, className }: DaySummaryChipsProps) {
  const items = [
    {
      key: "feeding",
      label: `${summary.feedingCount}回`,
      hint: "授乳",
      icon: Utensils,
      tone: "bg-primary/25 text-primary-foreground",
    },
    {
      key: "formula",
      label: `${summary.formulaMl}ml`,
      hint: "ミルク",
      icon: Milk,
      tone: "bg-accent/80 text-accent-foreground",
    },
    {
      key: "sleep",
      label: formatDurationMinutes(summary.sleepMinutes),
      hint: "睡眠",
      icon: MoonStar,
      tone: "bg-secondary/55 text-secondary-foreground",
    },
    {
      key: "diaper",
      label: `${summary.diaperCount}回`,
      hint: "おむつ",
      icon: Droplets,
      tone: "bg-mint/70 text-mint-foreground",
    },
  ] as const;

  return (
    <ul
      className={cn(
        "flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      aria-label="この日のまとめ"
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <li
            key={item.key}
            className="flex shrink-0 items-center gap-2 rounded-full bg-card px-3 py-1.5 shadow-soft"
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full",
                item.tone,
              )}
              aria-hidden
            >
              <Icon className="size-3.5" strokeWidth={1.75} />
            </span>
            <span className="text-xs">
              <span className="font-semibold text-foreground">{item.label}</span>
              <span className="ml-1 text-muted-foreground">{item.hint}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
