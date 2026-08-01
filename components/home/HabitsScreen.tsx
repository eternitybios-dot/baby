"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/EmptyState";
import { useAppData } from "@/components/providers/AppDataProvider";
import { jstYmd } from "@/lib/data/app-state";
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

export function HabitsScreen() {
  const { habits, addHabit, updateHabit, deleteHabit, now } = useAppData();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("授乳");
  const [body, setBody] = useState("");
  const [likelyTimeOfDay, setLikelyTimeOfDay] = useState("授乳の直前");
  const [frequency, setFrequency] = useState("ほぼ毎回");
  const [effectiveResponse, setEffectiveResponse] = useState("");

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error("習慣名を入力してください");
      return;
    }
    addHabit({
      name: name.trim(),
      category,
      body: body.trim() || "詳細未記入",
      likelyTimeOfDay,
      frequency,
      effectiveResponse: effectiveResponse.trim() || null,
      lastConfirmedAt: jstYmd(now),
      status: "active",
    });
    toast.success("習慣を保存しました");
    setName("");
    setBody("");
    setEffectiveResponse("");
  };

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">習慣・クセ</h1>
        <p className="text-sm text-muted-foreground">
          赤ちゃんのクセと効いた対応をメモ
        </p>
      </header>

      <section className="space-y-4 rounded-2xl bg-card p-4 shadow-soft">
        <p className="text-sm font-medium">新しい習慣</p>
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="habitName" className="leading-normal">
            習慣名
          </Label>
          <Input
            id="habitName"
            className="box-border h-11 min-h-11"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-5">
          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="habitCategory" className="leading-normal">
              カテゴリー
            </Label>
            <Input
              id="habitCategory"
              className="box-border h-11 min-h-11"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="habitFrequency" className="leading-normal">
              頻度
            </Label>
            <Input
              id="habitFrequency"
              className="box-border h-11 min-h-11"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            />
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="habitTime" className="leading-normal">
            出やすい時間帯
          </Label>
          <Input
            id="habitTime"
            className="box-border h-11 min-h-11"
            value={likelyTimeOfDay}
            onChange={(e) => setLikelyTimeOfDay(e.target.value)}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="habitBody" className="leading-normal">
            内容
          </Label>
          <Textarea
            id="habitBody"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <Label htmlFor="habitResponse" className="leading-normal">
            有効だった対応
          </Label>
          <Input
            id="habitResponse"
            className="box-border h-11 min-h-11"
            value={effectiveResponse}
            onChange={(e) => setEffectiveResponse(e.target.value)}
          />
        </div>
        <Button
          type="button"
          className="tap-target h-11 w-full"
          onClick={handleAdd}
          aria-label="習慣を保存"
        >
          保存する
        </Button>
      </section>

      {habits.length === 0 ? (
        <EmptyState
          title="習慣メモはまだありません"
          description="授乳前のサインや寝かしつけのコツを残しておきましょう"
        />
      ) : (
        <ul className="space-y-3">
          {habits.map((item) => (
            <li key={item.id} className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold">{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.category} ／ {item.frequency}
                  </p>
                </div>
                <Badge variant="secondary">
                  {item.status === "active" ? "有効" : "無効"}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed">{item.body}</p>
              <p className="mt-2 text-sm text-muted-foreground">
                出やすい時間帯: {item.likelyTimeOfDay}
              </p>
              {item.effectiveResponse ? (
                <p className="mt-1 text-sm text-foreground">
                  有効だった対応: {item.effectiveResponse}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  aria-label="最終確認日を更新"
                  onClick={() => {
                    updateHabit(item.id, { lastConfirmedAt: jstYmd(now) });
                    toast.success("最終確認日を更新しました");
                  }}
                >
                  今日確認した
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  aria-label="有効状態を切替"
                  onClick={() => {
                    updateHabit(item.id, {
                      status: item.status === "active" ? "inactive" : "active",
                    });
                    toast.success("状態を更新しました");
                  }}
                >
                  {item.status === "active" ? "無効にする" : "有効にする"}
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                最終確認: {item.lastConfirmedAt ?? "—"}
              </p>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-2 h-10 px-2 text-destructive"
                      aria-label="習慣を削除"
                    />
                  }
                >
                  削除
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>削除しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      この習慣メモを削除します。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteHabit(item.id);
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
