import { ChartsScreen } from "@/components/charts/ChartsScreen";
import { ErrorState } from "@/components/shared/ErrorState";
import { fetchCharts } from "@/lib/data/queries";
import { loadViewData } from "@/lib/data/load";

export default async function ChartsPage() {
  const state = await loadViewData(() => fetchCharts("7d"));
  if (state.status === "error") {
    return <ErrorState message={state.message} />;
  }
  return <ChartsScreen initialPeriod="7d" initialCharts={state.data} />;
}
