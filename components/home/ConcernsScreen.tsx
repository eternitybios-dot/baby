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
import type { ConcernStatus } from "@/types/domain";
import { formatClock, formatDisplayDate } from "@/lib/format";
import { toJstIso } from "@/lib/data/app-state";
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

const STATUS_LABEL: Record<ConcernStatus, string> = {
  open: "未対応",
  in_progress: "対応中",
  watching: "様子見",
  resolved: "解決",
};

const STATUS_OPTIONS: ConcernStatus[] = [
  "open",
  "in_progress",
  "watching",
  "resolved",
];

export function ConcernsScreen() {
  const { concerns, addConcern, updateConcern, deleteConcern } = useAppData();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("機嫌");

  const handleAdd = () => {
    if (!title.trim()) {
      toast.error("タイトルを入力してください");
      return;
    }
    addConcern({
      title: title.trim(),
      category,
      body: body.trim() || "詳細未記入",
      severity: 3,
      actionTaken: null,
      result: null,
      status: "open",
      occurredAt: toJstIso(),
    });
    toast.success("困り事を保存しました");
    setTitle("");
    setBody("");
  };

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-bold">困り事</h1>
        <p className="text-sm text-muted-foreground">
          気になることと対応を家族で共有
        </p>
      </header>

      <section className="space-y-3 rounded-2xl bg-card p-4 shadow-soft">
        <p className="text-sm font-medium">新しい困り事</p>
        <div className="space-y-1">
          <Label htmlFor="concernTitle">タイトル</Label>
          <Input
            id="concernTitle"
            className="h-11"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="concernCategory">カテゴリー</Label>
          <Input
            id="concernCategory"
            className="h-11"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="concernBody">内容</Label>
          <Textarea
            id="concernBody"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <Button
          type="button"
          className="tap-target h-11 w-full"
          onClick={handleAdd}
          aria-label="困り事を保存"
        >
          保存する
        </Button>
      </section>

      {concerns.length === 0 ? (
        <EmptyState
          title="困り事はまだありません"
          description="ぐずりや肌荒れなど、気になることを残しておくと振り返りやすくなります"
        />
      ) : (
        <ul className="space-y-3">
          {concerns.map((item) => (
            <li key={item.id} className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-base font-semibold">{item.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.category} ／ 程度 {item.severity}/5
                  </p>
                </div>
                <Badge variant="secondary">{STATUS_LABEL[item.status]}</Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground">
                {item.body}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="tap-target rounded-full bg-muted px-3 py-2 text-xs font-medium"
                    aria-label={`状態を${STATUS_LABEL[status]}にする`}
                    onClick={() => {
                      updateConcern(item.id, { status });
                      toast.success(`状態を「${STATUS_LABEL[status]}」に更新`);
                    }}
                  >
                    {STATUS_LABEL[status]}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {formatDisplayDate(item.occurredAt)} {formatClock(item.occurredAt)}{" "}
                ／ {item.recorder.displayName}
              </p>
              <AlertDialog>
                <AlertDialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      className="mt-2 h-10 px-2 text-destructive"
                      aria-label="困り事を削除"
                    />
                  }
                >
                  削除
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>削除しますか？</AlertDialogTitle>
                    <AlertDialogDescription>
                      この困り事を削除します。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>キャンセル</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        void (async () => {
                          try {
                            await deleteConcern(item.id);
                            toast.success("削除しました");
                          } catch {
                            /* runRemote 側で toast + 再読込 */
                          }
                        })();
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
