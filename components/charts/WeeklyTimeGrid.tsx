"use client";

import { formatAppDate } from "@/lib/date";
import {
  dayCountsByYmd,
  jstWeekdaySunday0,
  weekGridMarks,
  type SummaryCategory,
  type WeekGridMark,
} from "@/lib/data/day-log";
import type { CareRecord, CareRecordType } from "@/types/domain";
import { cn } from "@/lib/utils";

const HOUR_MARKS = [0, 3, 6, 9, 12, 15, 18, 21, 24];
const GRID_HEIGHT = 384;

const TYPE_DOT: Record<CareRecordType, string> = {
  breast: "bg-primary",
  formula: "bg-accent",
  pumped: "bg-accent",
  solid: "bg-soft-yellow",
  sleep: "bg-secondary",
  diaper: "bg-mint",
  temperature: "bg-primary",
  medicine: "bg-muted-foreground",
  symptom: "bg-destructive",
  clinic: "bg-muted-foreground",
  bath: "bg-secondary",
  other: "bg-muted-foreground",
  concern: "bg-destructive",
};

function markTop(mark: WeekGridMark): number {
  return ((mark.hour + mark.minute / 60) / 24) * GRID_HEIGHT;
}

function markHeight(mark: WeekGridMark): number | null {
  if (mark.endHour == null) return null;
  const start = mark.hour + mark.minute / 60;
  const height = ((mark.endHour - start) / 24) * GRID_HEIGHT;
  return height > 4 ? height : null;
}

interface WeeklyTimeGridProps {
  weekYmds: string[];
  records: CareRecord[];
  category: SummaryCategory;
}

export function WeeklyTimeGrid({
  weekYmds,
  records,
  category,
}: WeeklyTimeGridProps) {
  const marks = weekGridMarks(records, weekYmds, category);
  const counts = dayCountsByYmd(records, weekYmds, category);

  return (
    <section
      className="overflow-hidden rounded-2xl bg-card shadow-soft"
      aria-label="週の時間帯"
      data-no-tab-swipe
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: "1.4rem repeat(7, minmax(0, 1fr))" }}
      >
        <div aria-hidden />
        {weekYmds.map((ymd) => {
          const date = new Date(`${ymd}T12:00:00+09:00`);
          const weekday = jstWeekdaySunday0(date);
          return (
            <div key={`head-${ymd}`} className="py-2 text-center">
              <p
                className={cn(
                  "text-[11px] font-medium",
                  weekday === 0 && "text-destructive",
                  weekday === 6 && "text-[color:var(--chart-4)]",
                  weekday !== 0 && weekday !== 6 && "text-muted-foreground",
                )}
              >
                {formatAppDate(date, "M/d")}
              </p>
            </div>
          );
        })}
      </div>

      <div
        className="relative grid"
        style={{
          gridTemplateColumns: "1.4rem repeat(7, minmax(0, 1fr))",
          height: GRID_HEIGHT,
        }}
      >
        <div className="relative">
          {HOUR_MARKS.map((hour) => (
            <span
              key={hour}
              className="absolute right-0.5 -translate-y-1/2 text-[9px] tabular-nums text-muted-foreground"
              style={{ top: (hour / 24) * GRID_HEIGHT }}
            >
              {hour}
            </span>
          ))}
        </div>

        {weekYmds.map((ymd, column) => (
          <div
            key={ymd}
            className={cn(
              "relative border-l border-border/70",
              column % 2 === 0 ? "bg-primary/10" : "bg-background/40",
            )}
          >
            {Array.from({ length: 24 }, (_, hour) => (
              <span
                key={hour}
                className="absolute inset-x-0 border-t border-dashed border-border/80"
                style={{ top: (hour / 24) * GRID_HEIGHT }}
                aria-hidden
              />
            ))}
            {marks
              .filter((mark) => mark.ymd === ymd)
              .map((mark) => {
                const height = markHeight(mark);
                if (height != null) {
                  return (
                    <span
                      key={mark.recordId}
                      className={cn(
                        "absolute left-1/2 w-3 -translate-x-1/2 rounded-full shadow-soft",
                        TYPE_DOT[mark.recordType],
                      )}
                      style={{ top: markTop(mark), height }}
                      title={`${mark.hour}:${String(mark.minute).padStart(2, "0")}`}
                    />
                  );
                }
                return (
                  <span
                    key={mark.recordId}
                    className={cn(
                      "absolute left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-soft",
                      TYPE_DOT[mark.recordType],
                    )}
                    style={{ top: markTop(mark) }}
                    title={`${mark.hour}:${String(mark.minute).padStart(2, "0")}`}
                  />
                );
              })}
          </div>
        ))}
      </div>

      <div
        className="grid border-t border-border/80"
        style={{ gridTemplateColumns: "1.4rem repeat(7, minmax(0, 1fr))" }}
      >
        <div aria-hidden />
        {weekYmds.map((ymd) => (
          <div key={`count-${ymd}`} className="px-0.5 py-2 text-center">
            <p className="text-[10px] font-medium text-foreground">
              {counts[ymd] ?? 0}回
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
