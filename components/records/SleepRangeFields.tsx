"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildSleepRange } from "@/lib/data/sleep-range";
import { formatDurationMinutes } from "@/lib/format";

interface SleepRangeFieldsProps {
  startHm: string;
  endHm: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  anchor?: Date;
}

export function SleepRangeFields({
  startHm,
  endHm,
  onStartChange,
  onEndChange,
  anchor,
}: SleepRangeFieldsProps) {
  const preview = buildSleepRange({ startHm, endHm, anchor });

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5 rounded-2xl bg-card p-3 shadow-soft">
          <Label htmlFor="sleepStart" className="text-xs text-muted-foreground">
            開始
          </Label>
          <Input
            id="sleepStart"
            type="time"
            value={startHm}
            onChange={(e) => onStartChange(e.target.value)}
            className="h-11"
            aria-label="睡眠の開始時刻"
          />
        </div>
        <div className="space-y-1.5 rounded-2xl bg-card p-3 shadow-soft">
          <Label htmlFor="sleepEnd" className="text-xs text-muted-foreground">
            終了
          </Label>
          <Input
            id="sleepEnd"
            type="time"
            value={endHm}
            onChange={(e) => onEndChange(e.target.value)}
            className="h-11"
            aria-label="睡眠の終了時刻"
          />
        </div>
      </div>
      <p className="px-1 text-xs text-muted-foreground">
        {preview.ok
          ? `${formatDurationMinutes(preview.durationMinutes)}（終了が開始より前なら、開始は前日）`
          : preview.error}
      </p>
    </div>
  );
}
