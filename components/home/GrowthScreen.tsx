import { Ruler, Weight } from "lucide-react";
import { MetricChartCard } from "@/components/charts/MetricChartCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { fetchGrowthRecords } from "@/lib/data/queries";
import { loadViewData } from "@/lib/data/load";
import { formatAppDate } from "@/lib/date";
import type { DailyMetricPoint, GrowthPoint } from "@/types/domain";

function toWeightSeries(records: GrowthPoint[]): DailyMetricPoint[] {
  return records
    .filter((r) => r.weightG != null)
    .map((r) => ({
      date: r.measuredAt,
      label: formatAppDate(new Date(r.measuredAt), "M/d"),
      value: Number(((r.weightG ?? 0) / 1000).toFixed(2)),
    }));
}

export async function GrowthScreen() {
  const state = await loadViewData(() => fetchGrowthRecords());
  if (state.status === "error") {
    return <ErrorState message={state.message} />;
  }

  const records = state.data;
  const weightSeries = toWeightSeries(records);
  const latest = records.at(-1);
  const previous = records.at(-2);
  const weightDiffG =
    latest?.weightG != null && previous?.weightG != null
      ? latest.weightG - previous.weightG
      : null;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">成長記録</h1>
        <p className="text-sm text-muted-foreground">体重・身長・頭囲の推移</p>
      </header>

      {latest ? (
        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4 shadow-soft">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <Weight className="size-4" aria-hidden />
              <span className="text-xs">最新の体重</span>
            </div>
            <p className="text-lg font-semibold">
              {latest.weightG != null
                ? `${(latest.weightG / 1000).toFixed(2)} kg`
                : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {weightDiffG != null
                ? `前回比 ${weightDiffG >= 0 ? "+" : ""}${weightDiffG} g`
                : "前回比 —"}
            </p>
          </div>
          <div className="rounded-2xl bg-card p-4 shadow-soft">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <Ruler className="size-4" aria-hidden />
              <span className="text-xs">最新の身長</span>
            </div>
            <p className="text-lg font-semibold">
              {latest.heightCm != null ? `${latest.heightCm} cm` : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              測定日 {latest.measuredAt}
            </p>
          </div>
        </section>
      ) : null}

      <MetricChartCard
        title="体重推移"
        unit="kg"
        data={weightSeries}
        variant="line"
        emptyTitle="成長データがまだありません"
      />

      {records.length === 0 ? (
        <EmptyState
          title="成長記録がありません"
          description="健診や家庭での測定結果を残すと、増減が分かりやすくなります"
        />
      ) : (
        <ul className="space-y-3">
          {[...records].reverse().map((record) => (
            <li
              key={record.id}
              className="rounded-2xl bg-card p-4 shadow-soft"
            >
              <p className="text-sm font-semibold">{record.measuredAt}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                体重{" "}
                {record.weightG != null
                  ? `${(record.weightG / 1000).toFixed(2)}kg`
                  : "—"}
                ／ 身長 {record.heightCm ?? "—"}cm ／ 頭囲{" "}
                {record.headCircumferenceCm ?? "—"}cm
              </p>
              {record.note ? (
                <p className="mt-2 text-sm text-foreground">{record.note}</p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
