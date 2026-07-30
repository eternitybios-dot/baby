"use client";

import {
  AlertTriangle,
  Baby,
  Droplets,
  Milk,
  Moon,
  Thermometer,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import type { QuickRecordAction } from "@/types/domain";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface QuickRecordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAction?: QuickRecordAction | null;
}

const ACTIONS: Array<{
  key: QuickRecordAction;
  label: string;
  description: string;
  icon: typeof Milk;
  tone: string;
}> = [
  {
    key: "breast",
    label: "母乳",
    description: "左右の授乳時間を記録",
    icon: Baby,
    tone: "bg-primary/30",
  },
  {
    key: "formula",
    label: "ミルク",
    description: "飲んだ量をすばやく記録",
    icon: Milk,
    tone: "bg-accent/70",
  },
  {
    key: "sleep",
    label: "睡眠",
    description: "開始・終了をタップで記録",
    icon: Moon,
    tone: "bg-secondary/50",
  },
  {
    key: "diaper",
    label: "おむつ",
    description: "尿・便・両方を選択",
    icon: Droplets,
    tone: "bg-mint/60",
  },
  {
    key: "temperature",
    label: "体温",
    description: "検温結果を残す",
    icon: Thermometer,
    tone: "bg-muted",
  },
  {
    key: "concern",
    label: "困り事",
    description: "気になることをメモ",
    icon: AlertTriangle,
    tone: "bg-destructive/15",
  },
];

export function QuickRecordSheet({
  open,
  onOpenChange,
  initialAction = null,
}: QuickRecordSheetProps) {
  const [selected, setSelected] = useState<QuickRecordAction | null>(
    initialAction,
  );
  const selectedMeta = ACTIONS.find((item) => item.key === selected);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="app-max-width mx-auto rounded-t-3xl border-border bg-background">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-lg">クイック記録</DrawerTitle>
          <DrawerDescription>
            {selectedMeta
              ? `${selectedMeta.label}の記録内容を選んで保存できます（UIデモ）`
              : "片手で届く位置から種類を選んでください"}
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-4 overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-3 gap-3">
            {ACTIONS.map((action) => {
              const Icon = action.icon;
              const isSelected = selected === action.key;
              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => setSelected(action.key)}
                  className={cn(
                    "tap-target flex min-h-[5.75rem] flex-col items-center justify-center gap-2 rounded-2xl border bg-card p-3 shadow-soft transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
                    isSelected
                      ? "border-primary ring-2 ring-primary/40"
                      : "border-transparent",
                  )}
                  aria-label={`${action.label}を選択`}
                  aria-pressed={isSelected}
                >
                  <span
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full",
                      action.tone,
                    )}
                    aria-hidden
                  >
                    <Icon className="size-5" strokeWidth={1.75} />
                  </span>
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              );
            })}
          </div>

          {selectedMeta ? (
            <div className="rounded-2xl bg-card p-4 shadow-soft">
              <p className="text-sm font-medium text-foreground">
                {selectedMeta.label}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {selectedMeta.description}
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="tap-target h-11 flex-1"
                  onClick={() => onOpenChange(false)}
                  aria-label="閉じる"
                >
                  閉じる
                </Button>
                <Button
                  type="button"
                  className="tap-target h-11 flex-1"
                  onClick={() => onOpenChange(false)}
                  aria-label={`${selectedMeta.label}を保存（デモ）`}
                >
                  保存（デモ）
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
