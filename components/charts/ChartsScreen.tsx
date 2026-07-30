"use client";

import { useState, useTransition } from "react";
import { MetricChartCard } from "@/components/charts/MetricChartCard";
import { PeriodSelector } from "@/components/charts/PeriodSelector";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { fetchCharts } from "@/lib/data/queries";
import type { ChartBundle, ChartPeriod } from "@/types/domain";

interface ChartsScreenProps {
  initialPeriod: ChartPeriod;
  initialCharts: ChartBundle;
}

export function ChartsScreen({
  initialPeriod,
  initialCharts,
}: ChartsScreenProps) {
  const [period, setPeriod] = useState<ChartPeriod>(initialPeriod);
  const [charts, setCharts] = useState<ChartBundle>(initialCharts);
  const [error, setError] = useState<string | null>(null);
  const [customHint, setCustomHint] = useState(false);
  const [pending, startTransition] = useTransition();

  const handlePeriodChange = (next: ChartPeriod) => {
    setCustomHint(next === "custom");
    setPeriod(next);
    setError(null);
    startTransition(() => {
      void (async () => {
        try {
          const data = await fetchCharts(next);
          setCharts(data);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "グラフの取得に失敗しました",
          );
        }
      })();
    });
  };

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-foreground">グラフ</h1>
        <p className="text-sm text-muted-foreground">
          生活リズムと成長をひと目で確認
        </p>
      </header>

      <PeriodSelector value={period} onChange={handlePeriodChange} />

      {customHint ? (
        <p className="rounded-xl bg-accent/40 px-3 py-2 text-sm text-accent-foreground">
          期間指定は UI のみです。当面は7日分のサンプルを表示します。
        </p>
      ) : null}

      {pending ? <LoadingState label="グラフを更新中" rows={2} /> : null}
      {error ? <ErrorState message={error} /> : null}

      {!error ? (
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
      ) : null}
    </div>
  );
}
