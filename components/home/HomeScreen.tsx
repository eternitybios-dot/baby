"use client";

import { BabyHeader } from "@/components/home/BabyHeader";
import { CurrentStatusCard } from "@/components/home/CurrentStatusCard";
import { QuickActionGrid } from "@/components/home/QuickActionGrid";
import { TodaySummary } from "@/components/home/TodaySummary";
import { Timeline } from "@/components/records/Timeline";
import { LoadingState } from "@/components/shared/LoadingState";
import { useAppData } from "@/components/providers/AppDataProvider";

export function HomeScreen() {
  const { ready, baby, now, status, summary, timeline } = useAppData();

  if (!ready) return <LoadingState label="ホームを読み込み中" rows={4} />;

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
