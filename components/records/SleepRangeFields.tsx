"use client";

import { Label } from "@/components/ui/label";
import { buildSleepRange, formatHm, parseHm } from "@/lib/data/sleep-range";
import { formatDurationMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 60 }, (_, minute) => minute);

interface SleepRangeFieldsProps {
  startHm: string;
  endHm: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  anchor?: Date;
}

function TimeOfDayField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (hm: string) => void;
}) {
  const parsed = parseHm(value) ?? { hours: 0, minutes: 0 };

  return (
    <div className="space-y-1.5 rounded-2xl bg-card p-3 shadow-soft">
      <Label htmlFor={`${id}-hour`} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <div className="flex items-center gap-1.5">
        <select
          id={`${id}-hour`}
          className={cn(
            "tap-target h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-2 text-base tabular-nums",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
          )}
          value={parsed.hours}
          aria-label={`${label}の時`}
          onChange={(event) =>
            onChange(formatHm(Number(event.target.value), parsed.minutes))
          }
        >
          {HOURS.map((hour) => (
            <option key={hour} value={hour}>
              {hour}
            </option>
          ))}
        </select>
        <span className="shrink-0 text-sm text-muted-foreground">時</span>
        <select
          id={`${id}-minute`}
          className={cn(
            "tap-target h-11 min-w-0 flex-1 rounded-xl border border-input bg-background px-2 text-base tabular-nums",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40",
          )}
          value={parsed.minutes}
          aria-label={`${label}の分`}
          onChange={(event) =>
            onChange(formatHm(parsed.hours, Number(event.target.value)))
          }
        >
          {MINUTES.map((minute) => (
            <option key={minute} value={minute}>
              {String(minute).padStart(2, "0")}
            </option>
          ))}
        </select>
        <span className="shrink-0 text-sm text-muted-foreground">分</span>
      </div>
    </div>
  );
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
      <TimeOfDayField
        id="sleepStart"
        label="開始時刻"
        value={startHm}
        onChange={onStartChange}
      />
      <TimeOfDayField
        id="sleepEnd"
        label="終了時刻"
        value={endHm}
        onChange={onEndChange}
      />
      <p className="px-1 text-xs text-muted-foreground">
        {preview.ok
          ? `睡眠時間 ${formatDurationMinutes(preview.durationMinutes)}（終了が開始より前なら、開始は前日）`
          : preview.error}
      </p>
    </div>
  );
}
