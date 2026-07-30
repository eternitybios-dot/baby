"use client";

import { useState } from "react";
import { Ruler, Weight } from "lucide-react";
import { toast } from "sonner";
import { MetricChartCard } from "@/components/charts/MetricChartCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppData } from "@/components/providers/AppDataProvider";
import { formatAppDate } from "@/lib/date";
import { jstYmd } from "@/lib/data/app-state";
import type { DailyMetricPoint } from "@/types/domain";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function GrowthScreen() {
  const { growth, addGrowth, deleteGrowth, now } = useAppData();
  const [weightKg, setWeightKg] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [headCm, setHeadCm] = useState("");
  const [measuredAt, setMeasuredAt] = useState(jstYmd(now));
  const [note, setNote] = useState("");

  const weightSeries: DailyMetricPoint[] = growth
    .filter((r) => r.weightG != null)
    .map((r) => ({
      date: r.measuredAt,
      label: formatAppDate(new Date(`${r.measuredAt}T12:00:00+09:00`), "M/d"),
      value: Number(((r.weightG ?? 0) / 1000).toFixed(2)),
    }));

  const latest = [...growth].reverse()[0];
  const previous = [...growth].reverse()[1];
  const weightDiffG =
    latest?.weightG != null && previous?.weightG != null
      ? latest.weightG - previous.weightG
      : null;

  const handleAdd = () => {
    const weightG = weightKg ? Math.round(Number(weightKg) * 1000) : null;
    const height = heightCm ? Number(heightCm) : null;
    const head = headCm ? Number(headCm) : null;
    if (weightG == null && height == null && head == null) {
      toast.error("体重・身長・頭囲のいずれかを入力してください");
      return;
    }
    addGrowth({
      measuredAt,
      weightG,
      heightCm: height,
      headCircumferenceCm: head,
      note: note.trim() || null,
    });
    toast.success("成長記録を保存しました");
    setWeightKg("");
    setHeightCm("");
    setHeadCm("");
    setNote("");
  };

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">成長記録</h1>
        <p className="text-sm text-muted-foreground">体重・身長・頭囲の推移</p>
      </header>

      <section className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
        <p className="text-sm font-medium">新しい測定を追加</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="measuredAt">測定日</Label>
            <Input
              id="measuredAt"
              type="date"
              className="h-11"
              value={measuredAt}
              onChange={(e) => setMeasuredAt(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="weightKg">体重 (kg)</Label>
            <Input
              id="weightKg"
              inputMode="decimal"
              className="h-11"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="heightCm">身長 (cm)</Label>
            <Input
              id="heightCm"
              inputMode="decimal"
              className="h-11"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="headCm">頭囲 (cm)</Label>
            <Input
              id="headCm"
              inputMode="decimal"
              className="h-11"
              value={headCm}
              onChange={(e) => setHeadCm(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="growthNote">メモ</Label>
          <Input
            id="growthNote"
            className="h-11"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <Button
          type="button"
          className="tap-target h-11 w-full"
          onClick={handleAdd}
          aria-label="成長記録を保存"
        >
          保存する
        </Button>
      </section>

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

      {growth.length === 0 ? (
        <EmptyState
          title="成長記録がありません"
          description="健診や家庭での測定結果を残すと、増減が分かりやすくなります"
        />
      ) : (
        <ul className="space-y-3">
          {[...growth].reverse().map((record) => (
            <li key={record.id} className="rounded-2xl bg-card p-4 shadow-soft">
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
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-2 h-10 px-2 text-destructive"
                      aria-label="成長記録を削除"
                    />
                  }
                >
                  削除
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>削除しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      この成長記録を削除します。元に戻せません。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteGrowth(record.id);
                        toast.success("削除しました");
                      }}
                    >
                      削除する
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
