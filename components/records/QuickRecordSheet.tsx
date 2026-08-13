"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Baby,
  Droplets,
  Milk,
  Moon,
  Thermometer,
} from "lucide-react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppData } from "@/components/providers/AppDataProvider";
import { SleepRangeFields } from "@/components/records/SleepRangeFields";
import { buildSleepRange, defaultSleepTimes } from "@/lib/data/sleep-range";
import type { DiaperKind, QuickRecordAction } from "@/types/domain";
import { cn } from "@/lib/utils";

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
    description: "左右の授乳時間",
    icon: Baby,
    tone: "bg-primary/30",
  },
  {
    key: "formula",
    label: "ミルク",
    description: "飲んだ量 (ml)",
    icon: Milk,
    tone: "bg-accent/70",
  },
  {
    key: "sleep",
    label: "睡眠",
    description: "開始時刻と終了時刻",
    icon: Moon,
    tone: "bg-secondary/50",
  },
  {
    key: "diaper",
    label: "おむつ",
    description: "尿・便・両方",
    icon: Droplets,
    tone: "bg-mint/60",
  },
  {
    key: "temperature",
    label: "体温",
    description: "検温結果",
    icon: Thermometer,
    tone: "bg-muted",
  },
  {
    key: "concern",
    label: "困り事",
    description: "気になること",
    icon: AlertTriangle,
    tone: "bg-destructive/15",
  },
];

const DIAPER_OPTIONS: Array<{ value: DiaperKind; label: string }> = [
  { value: "urine", label: "尿" },
  { value: "stool", label: "便" },
  { value: "both", label: "尿・便" },
];

export function QuickRecordSheet({
  open,
  onOpenChange,
  initialAction = null,
}: QuickRecordSheetProps) {
  const { quickSave, currentUser } = useAppData();
  const [selected, setSelected] = useState<QuickRecordAction | null>(
    initialAction,
  );
  const [saving, setSaving] = useState(false);
  const [amountMl, setAmountMl] = useState("120");
  const [leftMinutes, setLeftMinutes] = useState("8");
  const [rightMinutes, setRightMinutes] = useState("6");
  const [sleepStartHm, setSleepStartHm] = useState(
    () => defaultSleepTimes().startHm,
  );
  const [sleepEndHm, setSleepEndHm] = useState(() => defaultSleepTimes().endHm);
  const [diaperKind, setDiaperKind] = useState<DiaperKind>("urine");
  const [celsius, setCelsius] = useState("36.5");
  const [concernTitle, setConcernTitle] = useState("");
  const [concernBody, setConcernBody] = useState("");

  const selectedMeta = ACTIONS.find((item) => item.key === selected);

  const handleSave = () => {
    if (!selected || saving) return;
    setSaving(true);
    try {
      if (selected === "sleep") {
        const range = buildSleepRange({
          startHm: sleepStartHm,
          endHm: sleepEndHm,
        });
        if (!range.ok) {
          toast.error(range.error);
          setSaving(false);
          return;
        }
        quickSave("sleep", {
          sleepStartedAt: range.startedAt,
          sleepEndedAt: range.endedAt,
          sleepMinutes: range.durationMinutes,
        });
        toast.success("睡眠を記録しました");
      } else if (selected === "formula") {
        quickSave("formula", { amountMl: Number(amountMl) || 120 });
        toast.success("ミルクを記録しました");
      } else if (selected === "breast") {
        quickSave("breast", {
          leftMinutes: Number(leftMinutes) || 0,
          rightMinutes: Number(rightMinutes) || 0,
        });
        toast.success("母乳を記録しました");
      } else if (selected === "diaper") {
        quickSave("diaper", { diaperKind });
        toast.success("おむつを記録しました");
      } else if (selected === "temperature") {
        quickSave("temperature", { celsius: Number(celsius) || 36.5 });
        toast.success("体温を記録しました");
      } else if (selected === "concern") {
        quickSave("concern", { concernTitle, concernBody });
        toast.success("困り事を記録しました");
      }
      onOpenChange(false);
    } catch {
      toast.error("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="app-max-width mx-auto rounded-t-3xl border-border bg-background">
        <DrawerHeader className="text-left">
          <DrawerTitle className="text-lg">クイック記録</DrawerTitle>
          <DrawerDescription>
            記録者: {currentUser.displayName}
            {selectedMeta
              ? ` ／ ${selectedMeta.label}`
              : " ／ 種類を選んで保存"}
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

          {selected === "formula" ? (
            <Field label="ミルク量 (ml)">
              <Input
                inputMode="numeric"
                value={amountMl}
                onChange={(e) => setAmountMl(e.target.value)}
                className="h-11"
                aria-label="ミルク量"
              />
            </Field>
          ) : null}

          {selected === "breast" ? (
            <div className="grid grid-cols-2 gap-3">
              <Field label="左 (分)">
                <Input
                  inputMode="numeric"
                  value={leftMinutes}
                  onChange={(e) => setLeftMinutes(e.target.value)}
                  className="h-11"
                  aria-label="左の授乳時間"
                />
              </Field>
              <Field label="右 (分)">
                <Input
                  inputMode="numeric"
                  value={rightMinutes}
                  onChange={(e) => setRightMinutes(e.target.value)}
                  className="h-11"
                  aria-label="右の授乳時間"
                />
              </Field>
            </div>
          ) : null}

          {selected === "diaper" ? (
            <div className="flex gap-2">
              {DIAPER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "tap-target h-11 flex-1 rounded-xl border text-sm font-medium",
                    diaperKind === option.value
                      ? "border-primary bg-primary/30"
                      : "border-border bg-card",
                  )}
                  aria-label={option.label}
                  aria-pressed={diaperKind === option.value}
                  onClick={() => setDiaperKind(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}

          {selected === "temperature" ? (
            <Field label="体温 (℃)">
              <Input
                inputMode="decimal"
                value={celsius}
                onChange={(e) => setCelsius(e.target.value)}
                className="h-11"
                aria-label="体温"
              />
            </Field>
          ) : null}

          {selected === "concern" ? (
            <div className="space-y-3">
              <Field label="タイトル">
                <Input
                  value={concernTitle}
                  onChange={(e) => setConcernTitle(e.target.value)}
                  className="h-11"
                  placeholder="例: 夕方のぐずり"
                  aria-label="困り事タイトル"
                />
              </Field>
              <Field label="内容">
                <Textarea
                  value={concernBody}
                  onChange={(e) => setConcernBody(e.target.value)}
                  placeholder="様子や気になること"
                  aria-label="困り事の内容"
                />
              </Field>
            </div>
          ) : null}

          {selected === "sleep" ? (
            <SleepRangeFields
              startHm={sleepStartHm}
              endHm={sleepEndHm}
              onStartChange={setSleepStartHm}
              onEndChange={setSleepEndHm}
            />
          ) : null}

          {selected ? (
            <div className="flex gap-2">
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
                disabled={saving}
                onClick={handleSave}
                aria-label={`${selectedMeta?.label ?? "記録"}を保存`}
              >
                {saving ? "保存中…" : "保存"}
              </Button>
            </div>
          ) : null}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5 rounded-2xl bg-card p-3 shadow-soft">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
