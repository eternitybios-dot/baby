import { formatAppDate } from "@/lib/date";
import { cn } from "@/lib/utils";

interface CalendarMonthProps {
  now: Date;
}

export function CalendarMonth({ now }: CalendarMonthProps) {
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ day: number | null; isToday: boolean }> = [];

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push({ day: null, isToday: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ day, isToday: day === now.getDate() });
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
        {cells.map((cell, index) => (
          <div
            key={`${cell.day ?? "empty"}-${index}`}
            className={cn(
              "flex aspect-square items-center justify-center rounded-xl text-sm",
              cell.day == null && "invisible",
              cell.isToday &&
                "bg-primary/35 font-semibold text-primary-foreground",
              cell.day != null && !cell.isToday && "text-foreground",
            )}
            aria-current={cell.isToday ? "date" : undefined}
          >
            {cell.day}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        日付ごとの詳細絞り込みは次フェーズで接続します。今日の記録を下に表示しています。
      </p>
    </section>
  );
}
