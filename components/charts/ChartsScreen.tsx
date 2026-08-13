"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricChartCard } from "@/components/charts/MetricChartCard";
import {
  SummaryCategoryTabs,
  SummaryModeToggle,
} from "@/components/charts/SummaryCategoryTabs";
import { WeeklyTimeGrid } from "@/components/charts/WeeklyTimeGrid";
import { PinkNavHeader } from "@/components/layout/PinkNavHeader";
import { useAppData } from "@/components/providers/AppDataProvider";
import {
  addJstDays,
  computeWeekMetrics,
  jstWeekYmds,
  mergeCareRecords,
  type SummaryCategory,
} from "@/lib/data/day-log";
import { jstYmd } from "@/lib/data/app-state";
import { formatAppDate } from "@/lib/date";
import { formatWeekRange } from "@/lib/format";
import type { DailyMetricPoint } from "@/types/domain";

export function ChartsScreen() {
  const {
    now,
    records,
    recordsList,
    growth,
    chartsLoading,
    loadRecordsForRange,
  } = useAppData();
  const todayYmd = jstYmd(now);
  const [anchorYmd, setAnchorYmd] = useState(todayYmd);
  const [category, setCategory] = useState<SummaryCategory>("feeding");
  const [mode, setMode] = useState<"time" | "amount">("time");

  const weekYmds = useMemo(
    () => jstWeekYmds(new Date(`${anchorYmd}T12:00:00+09:00`)),
    [anchorYmd],
  );
  const weekStart = weekYmds[0] ?? anchorYmd;
  const weekEnd = weekYmds[6] ?? anchorYmd;

  useEffect(() => {
    void loadRecordsForRange(weekStart, addJstDays(weekEnd, 1));
  }, [loadRecordsForRange, weekEnd, weekStart]);

  const weekRecords = useMemo(
    () => mergeCareRecords(records, recordsList),
    [records, recordsList],
  );
  const metrics = useMemo(
    () => computeWeekMetrics(weekRecords, weekYmds),
    [weekRecords, weekYmds],
  );

  const weightKg: DailyMetricPoint[] = useMemo(
    () =>
      growth
        .filter((point) => weekYmds.includes(point.measuredAt) && point.weightG != null)
        .map((point) => ({
          date: point.measuredAt,
          label: formatAppDate(
            new Date(`${point.measuredAt}T12:00:00+09:00`),
            "M/d",
          ),
          value: Number(((point.weightG ?? 0) / 1000).toFixed(2)),
        })),
    [growth, weekYmds],
  );

  const amountCards = (() => {
    if (category === "feeding") {
      return [
        {
          title: "授乳回数",
          unit: "回",
          data: metrics.feedingCounts,
          color: "var(--primary)",
        },
        {
          title: "ミルク量",
          unit: "ml",
          data: metrics.formulaMl,
          color: "var(--accent)",
        },
      ];
    }
    if (category === "sleep") {
      return [
        {
          title: "睡眠時間",
          unit: "時間",
          data: metrics.sleepHours,
          color: "var(--secondary)",
        },
      ];
    }
    if (category === "diaper") {
      return [
        {
          title: "おむつ回数",
          unit: "回",
          data: metrics.diaperCounts,
          color: "var(--mint)",
        },
      ];
    }
    if (category === "temperature") {
      return [];
    }
    return [
      {
        title: "授乳回数",
        unit: "回",
        data: metrics.feedingCounts,
        color: "var(--primary)",
      },
      {
        title: "ミルク量",
        unit: "ml",
        data: metrics.formulaMl,
        color: "var(--accent)",
      },
      {
        title: "睡眠時間",
        unit: "時間",
        data: metrics.sleepHours,
        color: "var(--secondary)",
      },
      {
        title: "おむつ回数",
        unit: "回",
        data: metrics.diaperCounts,
        color: "var(--mint)",
      },
      {
        title: "体重推移",
        unit: "kg",
        data: weightKg,
        color: "var(--primary)",
        variant: "line" as const,
      },
    ];
  })();

  return (
    <div className="space-y-4">
      <PinkNavHeader
        title={formatWeekRange(weekStart, weekEnd)}
        subtitle="まとめ"
        onPrev={() => setAnchorYmd(addJstDays(anchorYmd, -7))}
        onNext={() => setAnchorYmd(addJstDays(anchorYmd, 7))}
        prevLabel="前の週"
        nextLabel="次の週"
        className="pb-1"
      />
      <div className="-mx-4 -mt-4 space-y-3 bg-primary px-4 pb-3 pt-1">
        <SummaryCategoryTabs value={category} onChange={setCategory} />
        <SummaryModeToggle value={mode} onChange={setMode} />
      </div>

      {chartsLoading ? (
        <p className="text-sm text-muted-foreground">まとめを読み込み中…</p>
      ) : null}

      {mode === "time" ? (
        <WeeklyTimeGrid
          weekYmds={weekYmds}
          records={weekRecords}
          category={category}
        />
      ) : amountCards.length === 0 ? (
        <p className="rounded-2xl bg-card px-4 py-6 text-center text-sm text-muted-foreground shadow-soft">
          この週の体温は、時間表示の点で確認できます
        </p>
      ) : (
        <div className="space-y-4">
          {amountCards.map((card) => (
            <MetricChartCard
              key={card.title}
              title={card.title}
              unit={card.unit}
              data={card.data}
              color={card.color}
              variant={card.variant}
            />
          ))}
        </div>
      )}
    </div>
  );
}
