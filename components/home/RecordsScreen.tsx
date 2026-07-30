import { Timeline } from "@/components/records/Timeline";
import { ErrorState } from "@/components/shared/ErrorState";
import { fetchTodayTimeline } from "@/lib/data/queries";
import { loadViewData } from "@/lib/data/load";

export async function RecordsScreen() {
  const state = await loadViewData(() => fetchTodayTimeline());
  if (state.status === "error") {
    return <ErrorState message={state.message} />;
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">記録一覧</h1>
        <p className="text-sm text-muted-foreground">今日の育児記録</p>
      </header>
      <Timeline records={state.data} title="タイムライン" />
    </div>
  );
}
