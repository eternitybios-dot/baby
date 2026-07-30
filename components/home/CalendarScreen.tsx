import { CalendarMonth } from "@/components/home/CalendarMonth";
import { Timeline } from "@/components/records/Timeline";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  fetchReferenceNow,
  fetchTodayTimeline,
} from "@/lib/data/queries";
import { loadViewData } from "@/lib/data/load";
import { formatAppDate } from "@/lib/date";

export async function CalendarScreen() {
  const state = await loadViewData(async () => {
    const [timeline, now] = await Promise.all([
      fetchTodayTimeline(),
      fetchReferenceNow(),
    ]);
    return { timeline, now };
  });

  if (state.status === "error") {
    return <ErrorState message={state.message} />;
  }

  const { timeline, now } = state.data;

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">カレンダー</h1>
        <p className="text-sm text-muted-foreground">
          {formatAppDate(now, "yyyy年M月")}
        </p>
      </header>

      <CalendarMonth now={now} />
      <Timeline records={timeline} title="選択日のタイムライン（今日）" />
    </div>
  );
}
