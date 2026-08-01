import { Baby, Clock3, Droplets, Moon } from "lucide-react";
import type { HomeStatus } from "@/types/domain";
import { formatDurationMinutes, formatElapsed } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CurrentStatusCardProps {
  status: HomeStatus;
  now: Date;
  className?: string;
}

export function CurrentStatusCard({
  status,
  now,
  className,
}: CurrentStatusCardProps) {
  const items = [
    {
      key: "formula",
      icon: Baby,
      label: "最後のミルク",
      value: formatElapsed(status.lastFormulaAt, now),
      tone: "bg-primary/20 text-primary-foreground",
    },
    {
      key: "diaper",
      icon: Droplets,
      label: "最後のおむつ",
      value: formatElapsed(status.lastDiaperAt, now),
      tone: "bg-secondary/40 text-secondary-foreground",
    },
    {
      key: "sleep-when",
      icon: Moon,
      label: "最後の睡眠",
      value: status.lastSleepAt
        ? formatElapsed(status.lastSleepAt, now)
        : "まだなし",
      tone: "bg-accent/60 text-accent-foreground",
    },
    {
      key: "sleep-duration",
      icon: Clock3,
      label: "前回の睡眠時間",
      value:
        status.lastSleepMinutes != null && status.lastSleepMinutes > 0
          ? formatDurationMinutes(status.lastSleepMinutes)
          : "—",
      tone: "bg-muted text-foreground",
    },
  ] as const;

  return (
    <section
      className={cn("rounded-2xl bg-card p-4 shadow-soft", className)}
      aria-label="現在の状況"
    >
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">いまの状況</h2>
      <ul className="grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.key}
              className="flex items-start gap-2.5 rounded-xl bg-background/80 p-3"
            >
              <span
                className={cn(
                  "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
                  item.tone,
                )}
                aria-hidden
              >
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 text-sm font-semibold text-foreground">
                  {item.value}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
