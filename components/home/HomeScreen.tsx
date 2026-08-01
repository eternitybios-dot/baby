"use client";

import { BabyHeader } from "@/components/home/BabyHeader";
import { CurrentStatusCard } from "@/components/home/CurrentStatusCard";
import { HomeConcerns } from "@/components/home/HomeConcerns";
import { MoreLinks } from "@/components/home/MoreLinks";
import { TodaySummary } from "@/components/home/TodaySummary";
import { Timeline } from "@/components/records/Timeline";
import { useAppData } from "@/components/providers/AppDataProvider";

export function HomeScreen() {
  const { baby, now, status, summary, timeline, concerns, refresh, syncing } =
    useAppData();

  return (
    <div className="space-y-5">
      <BabyHeader
        baby={baby}
        now={now}
        syncing={syncing}
        onRefresh={refresh}
      />
      <CurrentStatusCard status={status} now={now} />
      <TodaySummary summary={summary} />
      <HomeConcerns concerns={concerns} />
      <Timeline records={timeline} />
      <MoreLinks />
    </div>
  );
}
