"use client";

import { formatAppDate } from "@/lib/date";
import { cn } from "@/lib/utils";

interface CalendarMonthProps {
  now: Date;
  selectedYmd: string;
  onSelectDay: (ymd: string) => void;
  markedYmds?: Set<string>;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function CalendarMonth({
  now,
  selectedYmd,
  onSelectDay,
  markedYmds,
}: CalendarMonthProps) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number | null; ymd: string | null }> = [];

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push({ day: null, ymd: null });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({
      day,
      ymd: `${year}-${pad(month + 1)}-${pad(day)}`,
    });
  }

  return (
    <section
      className="rounded-2xl bg-card p-4 shadow-soft"
      aria-label={`${formatAppDate(now, "yyyy年M月")}のカレンダー`}
    >
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
        {["日", "月", "火", "水", "木", "金", "土"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, index) => {
          if (cell.day == null || !cell.ymd) {
            return (
              <div
                key={`empty-${index}`}
                className="aspect-square invisible"
                aria-hidden
              />
            );
          }
          const selected = cell.ymd === selectedYmd;
          const marked = markedYmds?.has(cell.ymd) ?? false;
          return (
            <button
              key={cell.ymd}
              type="button"
              className={cn(
                "tap-target relative flex aspect-square items-center justify-center rounded-xl text-sm",
                selected
                  ? "bg-primary/35 font-semibold text-primary-foreground"
                  : "text-foreground",
              )}
              aria-label={`${cell.day}日の記録`}
              aria-current={selected ? "date" : undefined}
              onClick={() => onSelectDay(cell.ymd!)}
            >
              {cell.day}
              {marked ? (
                <span
                  className="absolute bottom-1 size-1 rounded-full bg-primary"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        日付をタップすると、その日の記録を下に表示します。
      </p>
    </section>
  );
}
