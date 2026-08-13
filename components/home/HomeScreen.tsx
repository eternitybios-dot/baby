"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { DayLogTimeline } from "@/components/home/DayLogTimeline";
import { DaySummaryChips } from "@/components/home/DaySummaryChips";
import { HomeConcerns } from "@/components/home/HomeConcerns";
import { MoreLinks } from "@/components/home/MoreLinks";
import { QuickLogBar } from "@/components/home/QuickLogBar";
import { PinkNavHeader } from "@/components/layout/PinkNavHeader";
import { useAppData } from "@/components/providers/AppDataProvider";
import { computeTodaySummary, recordsOnJstDay } from "@/lib/data/compute";
import {
  addJstDays,
  dateFromJstYmd,
  mergeCareRecords,
} from "@/lib/data/day-log";
import { jstYmd } from "@/lib/data/app-state";
import { formatAgeInMonths } from "@/lib/date";
import { formatLogDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function HomeScreen() {
  const {
    baby,
    now,
    records,
    recordsList,
    concerns,
    refresh,
    syncing,
    loadRecordsForDay,
  } = useAppData();
  const todayYmd = jstYmd(now);
  const [selectedYmd, setSelectedYmd] = useState(todayYmd);

  useEffect(() => {
    void loadRecordsForDay(selectedYmd);
  }, [loadRecordsForDay, selectedYmd]);

  const selectedDate = useMemo(
    () => dateFromJstYmd(selectedYmd),
    [selectedYmd],
  );
  const isToday = selectedYmd === todayYmd;
  const ageLabel = formatAgeInMonths(new Date(baby.birthDate), now);

  const dayRecords = useMemo(() => {
    const merged = mergeCareRecords(records, recordsList);
    return recordsOnJstDay(merged, selectedDate);
  }, [records, recordsList, selectedDate]);

  const summary = useMemo(() => {
    const merged = mergeCareRecords(records, recordsList);
    const summaryNow = isToday
      ? now
      : new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000 - 1);
    return computeTodaySummary(merged, summaryNow);
  }, [isToday, now, records, recordsList, selectedDate]);

  return (
    <div className={cn("space-y-4", isToday && "pb-20")}>
      <PinkNavHeader
        title={formatLogDate(selectedDate)}
        subtitle={`${baby.name}　生後${ageLabel}`}
        onPrev={() => setSelectedYmd(addJstDays(selectedYmd, -1))}
        onNext={() => setSelectedYmd(addJstDays(selectedYmd, 1))}
        prevLabel="前の日"
        nextLabel="次の日"
        trailing={
          <button
            type="button"
            className="tap-target flex size-11 shrink-0 items-center justify-center rounded-full text-primary-foreground/90 transition hover:bg-primary-foreground/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-foreground/40 disabled:opacity-60"
            aria-label="再読み込み"
            disabled={syncing}
            onClick={() => {
              void (async () => {
                try {
                  await refresh();
                  await loadRecordsForDay(selectedYmd);
                  toast.success("最新の記録を読み込みました");
                } catch {
                  toast.error("再読み込みに失敗しました");
                }
              })();
            }}
          >
            <RefreshCw
              className={cn("size-5", syncing && "animate-spin")}
              strokeWidth={1.75}
              aria-hidden
            />
          </button>
        }
      />

      <DaySummaryChips summary={summary} />
      <DayLogTimeline
        records={dayRecords}
        now={now}
        emptyTitle={
          isToday ? "まだ今日の記録がありません" : "この日の記録はありません"
        }
      />
      <HomeConcerns concerns={concerns} />
      <MoreLinks />
      {isToday ? (
        <div className="sticky bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-30">
          <QuickLogBar />
        </div>
      ) : null}
    </div>
  );
}
