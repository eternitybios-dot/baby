"use client";

import { CalendarMonth } from "@/components/home/CalendarMonth";
import { Timeline } from "@/components/records/Timeline";
import { useAppData } from "@/components/providers/AppDataProvider";
import { formatAppDate } from "@/lib/date";

export function CalendarScreen() {
  const { now, timeline } = useAppData();

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">カレンダー</h1>
        <p className="text-sm text-muted-foreground">
          {formatAppDate(now, "yyyy年M月")}
        </p>
      </header>

      <CalendarMonth now={now} />
      <Timeline records={timeline} title="今日のタイムライン" />
    </div>
  );
}
