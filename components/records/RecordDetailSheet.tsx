"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/components/providers/AppDataProvider";
import type { CareRecord } from "@/types/domain";
import { timelinePrimaryText, timelineTimeText } from "@/lib/format";

interface RecordDetailSheetProps {
  record: CareRecord | null;
  onClose: () => void;
}

export function RecordDetailSheet({ record, onClose }: RecordDetailSheetProps) {
  const { deleteCareRecord } = useAppData();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!record) return null;

  return (
    <Drawer
      open={Boolean(record)}
      onOpenChange={(open) => {
        if (!open) {
          setConfirmDelete(false);
          onClose();
        }
      }}
    >
      <DrawerContent className="app-max-width mx-auto rounded-t-3xl">
        <DrawerHeader className="text-left">
          <DrawerTitle>記録の詳細</DrawerTitle>
          <DrawerDescription>
            {timelineTimeText(record)} ／ {record.recorder.displayName}
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-4 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="rounded-2xl bg-card p-4 shadow-soft">
            <p className="text-base font-semibold">
              {timelinePrimaryText(record)}
            </p>
            {record.note ? (
              <p className="mt-2 text-sm text-muted-foreground">{record.note}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            {!confirmDelete ? (
              <Button
                type="button"
                variant="destructive"
                className="tap-target h-11"
                aria-label="記録を削除"
                onClick={() => setConfirmDelete(true)}
              >
                削除する
              </Button>
            ) : (
              <div className="space-y-2 rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-sm text-foreground">本当に削除しますか？</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="tap-target h-11 flex-1"
                    onClick={() => setConfirmDelete(false)}
                    aria-label="削除をキャンセル"
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="tap-target h-11 flex-1"
                    aria-label="削除を確定"
                    onClick={() => {
                      deleteCareRecord(record.id);
                      toast.success("記録を削除しました");
                      setConfirmDelete(false);
                      onClose();
                    }}
                  >
                    削除する
                  </Button>
                </div>
              </div>
            )}

            <Button
              type="button"
              variant="outline"
              className="tap-target h-11"
              onClick={onClose}
              aria-label="閉じる"
            >
              閉じる
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
