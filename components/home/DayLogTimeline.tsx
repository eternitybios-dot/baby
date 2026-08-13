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
import {
  groupRecordsByJstHour,
  sleepOccupiedHours,
  sleepSpansOnJstDay,
  timelineCardGroups,
} from "@/lib/data/day-log";
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
  const instantRecords = records.filter((record) => record.recordType !== "sleep");
  const byHour = groupRecordsByJstHour(instantRecords, day);
  const sleepHours = sleepOccupiedHours(records, day);
  const sleepSpans = sleepSpansOnJstDay(records, day);
  const cardGroups = timelineCardGroups(records, day);

  if (records.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description="下のアイコンか記録ボタンから残せます"
      />
    );
  }

  const stackedHours = new Set<number>();
  for (const group of cardGroups) {
    if (group.records.length < 2) continue;
    for (let hour = group.startHour; hour <= group.endHour; hour += 1) {
      stackedHours.add(hour);
    }
  }

  const rowSizes = HOURS.map((hour) => {
    if (byHour[hour].length > 0 || stackedHours.has(hour)) {
      return "minmax(3.5rem, auto)";
    }
    if (sleepHours.has(hour)) return "minmax(2.5rem, auto)";
    return "1rem";
  }).join(" ");

  return (
    <section aria-label="一日のタイムライン" className="relative">
      <div
        className="grid"
        style={{
          gridTemplateColumns: "1.75rem 0.9rem minmax(0, 1fr)",
          gridTemplateRows: rowSizes,
          columnGap: "0.5rem",
        }}
      >
        {HOURS.map((hour) => (
          <div
            key={`label-${hour}`}
            className="pt-0.5 text-right text-[10px] tabular-nums leading-none text-muted-foreground"
            style={{ gridColumn: 1, gridRow: hour + 1 }}
          >
            {hour}
          </div>
        ))}

        <div
          className="relative"
          style={{ gridColumn: 2, gridRow: "1 / 25" }}
          aria-hidden
        >
          <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border" />
        </div>

        {sleepSpans.map((span) => (
          <div
            key={`bar-${span.record.id}`}
            className="relative z-10"
            style={{
              gridColumn: 2,
              gridRow: `${span.startHour + 1} / ${span.endHour + 2}`,
            }}
            aria-hidden
          >
            <span className="absolute inset-y-0 left-1/2 w-2.5 -translate-x-1/2 rounded-full bg-secondary" />
          </div>
        ))}

        {HOURS.map((hour) =>
          byHour[hour].length > 0 ? (
            <div
              key={`dot-${hour}`}
              className="relative z-20 flex justify-center pt-1"
              style={{ gridColumn: 2, gridRow: hour + 1 }}
              aria-hidden
            >
              <span className="size-2.5 rounded-full bg-accent shadow-soft" />
            </div>
          ) : null,
        )}

        {cardGroups.map((group) => (
          <div
            key={group.records.map((record) => record.id).join("-")}
            className="z-10 flex min-h-0 flex-col justify-center gap-2 py-1"
            style={{
              gridColumn: 3,
              gridRow: `${group.startHour + 1} / ${group.endHour + 2}`,
            }}
          >
            {group.records.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                now={now}
                onOpen={() => openDetail(record)}
              />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function RecordCard({
  record,
  now,
  onOpen,
}: {
  record: CareRecord;
  now: Date;
  onOpen: () => void;
}) {
  const meta = ICON_MAP[record.recordType];
  const Icon = meta.icon;

  return (
    <button
      type="button"
      onClick={onOpen}
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
}
