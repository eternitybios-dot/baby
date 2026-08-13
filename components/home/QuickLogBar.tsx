"use client";

import { Droplets, Milk, Moon, Thermometer } from "lucide-react";
import { toast } from "sonner";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useQuickRecord } from "@/components/layout/MobileAppShell";
import { cn } from "@/lib/utils";
import type { DiaperKind, QuickRecordAction } from "@/types/domain";

const ACTIONS: Array<{
  key: string;
  label: string;
  tone: string;
  icon: typeof Milk;
  run: "sheet" | "diaper";
  action?: QuickRecordAction;
  diaperKind?: DiaperKind;
}> = [
  {
    key: "urine",
    label: "おしっこ",
    tone: "bg-mint text-mint-foreground",
    icon: Droplets,
    run: "diaper",
    diaperKind: "urine",
  },
  {
    key: "stool",
    label: "うんち",
    tone: "bg-accent text-accent-foreground",
    icon: Droplets,
    run: "diaper",
    diaperKind: "stool",
  },
  {
    key: "both",
    label: "両方",
    tone: "bg-secondary text-secondary-foreground",
    icon: Droplets,
    run: "diaper",
    diaperKind: "both",
  },
  {
    key: "temperature",
    label: "体温",
    tone: "bg-primary/80 text-primary-foreground",
    icon: Thermometer,
    run: "sheet",
    action: "temperature",
  },
  {
    key: "formula",
    label: "ミルク",
    tone: "bg-accent/90 text-accent-foreground",
    icon: Milk,
    run: "sheet",
    action: "formula",
  },
  {
    key: "sleep",
    label: "睡眠",
    tone: "bg-secondary/80 text-secondary-foreground",
    icon: Moon,
    run: "sheet",
    action: "sleep",
  },
];

interface QuickLogBarProps {
  className?: string;
}

export function QuickLogBar({ className }: QuickLogBarProps) {
  const { quickSave } = useAppData();
  const openSheet = useQuickRecord();

  return (
    <nav
      className={cn(
        "rounded-2xl bg-card/95 px-2 py-2 shadow-soft backdrop-blur",
        className,
      )}
      aria-label="クイック記録"
      data-no-tab-swipe
    >
      <ul className="flex justify-between gap-1">
        {ACTIONS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.key} className="min-w-0 flex-1">
              <button
                type="button"
                className="tap-target flex w-full flex-col items-center gap-1 rounded-xl px-0.5 py-1 text-[10px] font-medium text-foreground transition active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
                aria-label={`${item.label}を記録`}
                onClick={() => {
                  if (item.run === "diaper" && item.diaperKind) {
                    quickSave("diaper", { diaperKind: item.diaperKind });
                    toast.success(`${item.label}を記録しました`);
                    return;
                  }
                  if (item.action) openSheet(item.action);
                }}
              >
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full",
                    item.tone,
                  )}
                  aria-hidden
                >
                  <Icon className="size-5" strokeWidth={1.75} />
                </span>
                {item.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
