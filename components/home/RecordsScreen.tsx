"use client";

import { Timeline } from "@/components/records/Timeline";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/components/providers/AppDataProvider";

export function RecordsScreen() {
  const {
    recordsList,
    hasMoreRecords,
    loadingMoreRecords,
    loadMoreRecords,
  } = useAppData();

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">記録一覧</h1>
        <p className="text-sm text-muted-foreground">
          新しい順に表示。古い記録は追加読み込みできます。
        </p>
      </header>
      <Timeline records={recordsList} title="タイムライン" />
      {hasMoreRecords ? (
        <Button
          type="button"
          variant="outline"
          className="tap-target h-11 w-full"
          disabled={loadingMoreRecords}
          onClick={() => void loadMoreRecords()}
          aria-label="さらに記録を読み込む"
        >
          {loadingMoreRecords ? "読み込み中…" : "さらに読み込む"}
        </Button>
      ) : null}
    </div>
  );
}
