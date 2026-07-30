"use client";

import {
  AlertTriangle,
  Baby,
  Droplets,
  Milk,
  Moon,
  Thermometer,
} from "lucide-react";
import { useQuickRecord } from "@/components/layout/MobileAppShell";
import type { QuickRecordAction } from "@/types/domain";
import { cn } from "@/lib/utils";

const ACTIONS: Array<{
  key: QuickRecordAction;
  label: string;
  icon: typeof Milk;
  tone: string;
}> = [
  {
    key: "breast",
    label: "母乳",
    icon: Baby,
    tone: "bg-primary/30 text-primary-foreground",
  },
  {
    key: "formula",
    label: "ミルク",
    icon: Milk,
    tone: "bg-accent/70 text-accent-foreground",
  },
  {
    key: "sleep",
    label: "睡眠",
    icon: Moon,
    tone: "bg-secondary/50 text-secondary-foreground",
  },
  {
    key: "diaper",
    label: "おむつ",
    icon: Droplets,
    tone: "bg-mint/60 text-mint-foreground",
  },
  {
    key: "temperature",
    label: "体温",
    icon: Thermometer,
    tone: "bg-muted text-foreground",
  },
  {
    key: "concern",
    label: "困り事",
    icon: AlertTriangle,
    tone: "bg-destructive/15 text-destructive",
  },
];

interface QuickActionGridProps {
  className?: string;
}

export function QuickActionGrid({ className }: QuickActionGridProps) {
  const openQuickRecord = useQuickRecord();

  return (
    <section className={cn("space-y-3", className)} aria-label="クイック入力">
      <h2 className="text-sm font-medium text-muted-foreground">クイック入力</h2>
      <div className="grid grid-cols-3 gap-3">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              type="button"
              onClick={() => openQuickRecord(action.key)}
              className="tap-target flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-2xl bg-card p-3 shadow-soft transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
              aria-label={`${action.label}を記録`}
            >
              <span
                className={cn(
                  "flex size-12 items-center justify-center rounded-full",
                  action.tone,
                )}
                aria-hidden
              >
                <Icon className="size-6" strokeWidth={1.75} />
              </span>
              <span className="text-sm font-medium text-foreground">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
