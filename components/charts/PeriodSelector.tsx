"use client";

import { cn } from "@/lib/utils";
import type { ChartPeriod } from "@/types/domain";

interface PeriodSelectorProps {
  value: ChartPeriod;
  onChange: (period: ChartPeriod) => void;
  className?: string;
}

const OPTIONS: Array<{ value: ChartPeriod; label: string }> = [
  { value: "7d", label: "7日" },
  { value: "30d", label: "30日" },
  { value: "custom", label: "期間指定" },
];

export function PeriodSelector({
  value,
  onChange,
  className,
}: PeriodSelectorProps) {
  return (
    <div
      className={cn(
        "flex gap-2 rounded-2xl bg-card p-1.5 shadow-soft",
        className,
      )}
      role="tablist"
      aria-label="グラフ期間"
    >
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-label={option.label}
            className={cn(
              "tap-target min-h-11 flex-1 rounded-xl px-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
              selected
                ? "bg-primary/35 text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
