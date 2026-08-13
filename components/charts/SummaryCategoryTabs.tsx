"use client";

import { cn } from "@/lib/utils";
import type { SummaryCategory } from "@/lib/data/day-log";

const CATEGORIES: Array<{ value: SummaryCategory; label: string }> = [
  { value: "feeding", label: "食事" },
  { value: "sleep", label: "睡眠" },
  { value: "diaper", label: "排泄" },
  { value: "temperature", label: "体温" },
  { value: "all", label: "すべて" },
];

interface SummaryCategoryTabsProps {
  value: SummaryCategory;
  onChange: (value: SummaryCategory) => void;
}

export function SummaryCategoryTabs({
  value,
  onChange,
}: SummaryCategoryTabsProps) {
  return (
    <div
      className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="まとめの種類"
      data-no-tab-swipe
    >
      {CATEGORIES.map((item) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cn(
              "tap-target shrink-0 rounded-full px-3.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
              selected
                ? "bg-card text-primary shadow-soft"
                : "text-primary-foreground/80 hover:bg-primary-foreground/10",
            )}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

interface SummaryModeToggleProps {
  value: "time" | "amount";
  onChange: (value: "time" | "amount") => void;
}

export function SummaryModeToggle({ value, onChange }: SummaryModeToggleProps) {
  return (
    <div
      className="mx-auto flex w-fit rounded-full bg-card p-1 shadow-soft"
      role="tablist"
      aria-label="表示の切り替え"
    >
      {(
        [
          { key: "time", label: "時間" },
          { key: "amount", label: "量" },
        ] as const
      ).map((item) => {
        const selected = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={selected}
            className={cn(
              "tap-target min-w-20 rounded-full px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
              selected
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
            onClick={() => onChange(item.key)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
