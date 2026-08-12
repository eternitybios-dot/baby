"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarMonth } from "@/components/home/CalendarMonth";
import { Timeline } from "@/components/records/Timeline";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAppData } from "@/components/providers/AppDataProvider";
import { recordsOnJstDay } from "@/lib/data/compute";
import { jstYmd, startOfJstDay } from "@/lib/data/app-state";
import { formatAppDate } from "@/lib/date";

export function CalendarScreen() {
  const { now, records, recordsList, loadRecordsForDay } = useAppData();
  const todayYmd = jstYmd(now);
  const [selectedYmd, setSelectedYmd] = useState(todayYmd);

  useEffect(() => {
    void loadRecordsForDay(selectedYmd);
  }, [loadRecordsForDay, selectedYmd]);

  const selectedDate = useMemo(
    () => startOfJstDay(new Date(`${selectedYmd}T12:00:00+09:00`)),
    [selectedYmd],
  );

  const dayRecords = useMemo(() => {
    const merged = new Map(
      [...records, ...recordsList].map((r) => [r.id, r] as const),
    );
    return recordsOnJstDay([...merged.values()], selectedDate);
  }, [records, recordsList, selectedDate]);

  const markedYmds = useMemo(() => {
    const set = new Set<string>();
    for (const record of [...records, ...recordsList]) {
      set.add(jstYmd(new Date(record.recordedAt)));
    }
    return set;
  }, [records, recordsList]);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">カレンダー</h1>
        <p className="text-sm text-muted-foreground">
          {formatAppDate(now, "yyyy年M月")}
        </p>
      </header>

      <CalendarMonth
        now={now}
        selectedYmd={selectedYmd}
        onSelectDay={setSelectedYmd}
        markedYmds={markedYmds}
      />
      {dayRecords.length === 0 ? (
        <EmptyState
          title={`${formatAppDate(selectedDate, "M月d日")}の記録はありません`}
          description="別の日を選ぶか、ホームから記録できます"
        />
      ) : (
        <Timeline
          records={dayRecords}
          title={`${formatAppDate(selectedDate, "M月d日(EEE)")}の記録`}
        />
      )}
    </div>
  );
}
