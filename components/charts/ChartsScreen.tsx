"use client";

import { useEffect, useMemo, useState } from "react";
import { MetricChartCard } from "@/components/charts/MetricChartCard";
import { PeriodSelector } from "@/components/charts/PeriodSelector";
import { useAppData } from "@/components/providers/AppDataProvider";
import type { ChartPeriod } from "@/types/domain";

export function ChartsScreen() {
  const { getCharts, chartPeriod, setChartPeriod, chartsLoading } = useAppData();
  const [period, setPeriod] = useState<ChartPeriod>(chartPeriod);
  const charts = useMemo(() => getCharts(period), [getCharts, period]);

  useEffect(() => {
    if (period !== chartPeriod) {
      setChartPeriod(period);
    }
  }, [period, chartPeriod, setChartPeriod]);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-foreground">グラフ</h1>
        <p className="text-sm text-muted-foreground">
          選択した期間の記録だけを取得して集計します
        </p>
      </header>

      <PeriodSelector value={period} onChange={setPeriod} />

      {period === "custom" ? (
        <p className="rounded-xl bg-accent/40 px-3 py-2 text-sm text-accent-foreground">
          期間指定は直近14日分を表示します。
        </p>
      ) : null}

      {chartsLoading ? (
        <p className="text-sm text-muted-foreground">グラフを読み込み中…</p>
      ) : null}

      <div className="space-y-4">
        <MetricChartCard
          title="睡眠時間"
          unit="時間"
          data={charts.sleepHours}
          color="var(--secondary)"
        />
        <MetricChartCard
          title="授乳回数"
          unit="回"
          data={charts.feedingCounts}
          color="var(--primary)"
        />
        <MetricChartCard
          title="ミルク量"
          unit="ml"
          data={charts.formulaMl}
          color="var(--accent)"
        />
        <MetricChartCard
          title="おむつ回数"
          unit="回"
          data={charts.diaperCounts}
          color="var(--mint)"
        />
        <MetricChartCard
          title="体重推移"
          unit="kg"
          data={charts.weightKg}
          variant="line"
          color="var(--primary)"
        />
      </div>
    </div>
  );
}
