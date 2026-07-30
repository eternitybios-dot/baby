import { Baby, Clock3, Droplets, Moon } from "lucide-react";
import type { HomeStatus } from "@/types/domain";
import { formatElapsed } from "@/lib/format";
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
  const sleepElapsed = status.sleepStartedAt
    ? formatElapsed(status.sleepStartedAt, now)
    : null;

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
      key: "sleep-state",
      icon: Moon,
      label: "現在",
      value: status.isSleeping ? "睡眠中" : "起きている",
      tone: "bg-accent/60 text-accent-foreground",
    },
    {
      key: "sleep-elapsed",
      icon: Clock3,
      label: "睡眠経過",
      value: status.isSleeping && sleepElapsed ? sleepElapsed.replace("前", "") : "—",
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
