"use client";

import {
  AlertTriangle,
  Baby,
  Droplets,
  Milk,
  Moon,
  Thermometer,
} from "lucide-react";
import type { CareRecord, CareRecordType } from "@/types/domain";
import { formatElapsed, timelinePrimaryText, timelineTimeText } from "@/lib/format";
import { groupRecordsByJstHour, sleepOccupiedHours } from "@/lib/data/day-log";
import { cn } from "@/lib/utils";
import { useOpenRecordDetail } from "@/components/layout/MobileAppShell";
import { EmptyState } from "@/components/shared/EmptyState";

const ICON_MAP: Record<
  CareRecordType,
  { icon: typeof Milk; tone: string }
> = {
  breast: { icon: Baby, tone: "bg-primary text-primary-foreground" },
  formula: { icon: Milk, tone: "bg-accent text-accent-foreground" },
  pumped: { icon: Milk, tone: "bg-accent/80 text-accent-foreground" },
  solid: { icon: Baby, tone: "bg-soft-yellow text-soft-yellow-foreground" },
  sleep: { icon: Moon, tone: "bg-secondary text-secondary-foreground" },
  diaper: { icon: Droplets, tone: "bg-mint text-mint-foreground" },
  temperature: { icon: Thermometer, tone: "bg-primary/80 text-primary-foreground" },
  medicine: { icon: Thermometer, tone: "bg-muted text-foreground" },
  symptom: { icon: AlertTriangle, tone: "bg-destructive/20 text-destructive" },
  clinic: { icon: AlertTriangle, tone: "bg-muted text-foreground" },
  bath: { icon: Droplets, tone: "bg-secondary/70 text-secondary-foreground" },
  other: { icon: Baby, tone: "bg-muted text-foreground" },
  concern: { icon: AlertTriangle, tone: "bg-destructive/20 text-destructive" },
};

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

interface DayLogTimelineProps {
  records: CareRecord[];
  now: Date;
  day: Date;
  emptyTitle?: string;
}

export function DayLogTimeline({
  records,
  now,
  day,
  emptyTitle = "この日の記録はまだありません",
}: DayLogTimelineProps) {
  const openDetail = useOpenRecordDetail();
  const byHour = groupRecordsByJstHour(records, day);
  const sleepHours = sleepOccupiedHours(records, day);

  if (records.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description="下のアイコンか記録ボタンから残せます"
      />
    );
  }

  return (
    <section aria-label="一日のタイムライン" className="relative">
      <ol className="space-y-0">
        {HOURS.map((hour) => {
          const hourRecords = byHour[hour];
          const hasEvents = hourRecords.length > 0;
          const inSleep = sleepHours.has(hour);
          return (
            <li
              key={hour}
              className={cn(
                "flex gap-2",
                hasEvents
                  ? "min-h-14 items-start py-1"
                  : inSleep
                    ? "h-6 items-stretch"
                    : "h-4 items-center",
              )}
            >
              <div className="flex w-7 shrink-0 flex-col items-end pt-0.5">
                <span className="text-[10px] tabular-nums leading-none text-muted-foreground">
                  {hour}
                </span>
              </div>
              <div className="relative flex w-3 shrink-0 flex-col items-center self-stretch">
                <span
                  className="absolute inset-y-0 w-px bg-border"
                  aria-hidden
                />
                {inSleep ? (
                  <span
                    className="absolute inset-y-0 w-1 rounded-full bg-secondary"
                    aria-hidden
                  />
                ) : null}
                {hasEvents ? (
                  <span
                    className="relative z-10 mt-1 size-2.5 rounded-full bg-accent shadow-soft"
                    aria-hidden
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                {hourRecords.map((record) => {
                  const meta = ICON_MAP[record.recordType];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={record.id}
                      type="button"
                      onClick={() => openDetail(record)}
                      className="flex w-full min-h-11 items-center gap-2.5 rounded-2xl bg-card px-2.5 py-2 text-left shadow-soft transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40 active:scale-[0.99]"
                      aria-label={`${timelinePrimaryText(record)}の詳細`}
                    >
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full",
                          meta.tone,
                        )}
                        aria-hidden
                      >
                        <Icon className="size-4" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-primary">
                            {timelinePrimaryText(record)}
                          </span>
                          <time
                            dateTime={record.recordedAt}
                            className="shrink-0 text-[11px] tabular-nums text-muted-foreground"
                          >
                            {timelineTimeText(record)}
                          </time>
                        </span>
                        <span className="mt-0.5 block text-[11px] text-primary/80">
                          {formatElapsed(record.recordedAt, now)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
