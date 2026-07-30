"use client";

import { Timeline } from "@/components/records/Timeline";
import { useAppData } from "@/components/providers/AppDataProvider";

export function RecordsScreen() {
  const { timeline } = useAppData();

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">記録一覧</h1>
        <p className="text-sm text-muted-foreground">今日の育児記録</p>
      </header>
      <Timeline records={timeline} title="タイムライン" />
    </div>
  );
}
