import { BabyHeader } from "@/components/home/BabyHeader";
import { CurrentStatusCard } from "@/components/home/CurrentStatusCard";
import { QuickActionGrid } from "@/components/home/QuickActionGrid";
import { TodaySummary } from "@/components/home/TodaySummary";
import { Timeline } from "@/components/records/Timeline";
import { ErrorState } from "@/components/shared/ErrorState";
import {
  fetchBaby,
  fetchHomeStatus,
  fetchReferenceNow,
  fetchTodaySummary,
  fetchTodayTimeline,
} from "@/lib/data/queries";
import { loadViewData } from "@/lib/data/load";

export async function HomeScreen() {
  const state = await loadViewData(async () => {
    const [baby, status, summary, timeline, now] = await Promise.all([
      fetchBaby(),
      fetchHomeStatus(),
      fetchTodaySummary(),
      fetchTodayTimeline(),
      fetchReferenceNow(),
    ]);
    return { baby, status, summary, timeline, now };
  });

  if (state.status === "error") {
    return <ErrorState message={state.message} />;
  }

  const { baby, status, summary, timeline, now } = state.data;

  return (
    <div className="space-y-5">
      <BabyHeader baby={baby} now={now} />
      <CurrentStatusCard status={status} now={now} />
      <TodaySummary summary={summary} />
      <QuickActionGrid />
      <Timeline records={timeline} />
    </div>
  );
}
