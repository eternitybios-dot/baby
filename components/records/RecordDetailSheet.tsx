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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppData } from "@/components/providers/AppDataProvider";
import { SleepRangeFields } from "@/components/records/SleepRangeFields";
import type { CareRecord, CareRecordDetail, DiaperKind } from "@/types/domain";
import { buildSleepRange, jstHm } from "@/lib/data/sleep-range";
import { timelinePrimaryText, timelineTimeText } from "@/lib/format";

interface RecordDetailSheetProps {
  record: CareRecord | null;
  onClose: () => void;
}

function patchFromEdits(
  record: CareRecord,
  edits: {
    note: string;
    amountMl: string;
    leftMinutes: string;
    rightMinutes: string;
    sleepStartHm: string;
    sleepEndHm: string;
    celsius: string;
    diaperKind: DiaperKind;
  },
): { ok: true; patch: Partial<CareRecord> } | { ok: false; error: string } {
  const note = edits.note.trim() || null;
  let detail: CareRecordDetail = record.detail;
  let startedAt = record.startedAt;
  let endedAt = record.endedAt;
  let recordedAt = record.recordedAt;

  if (record.detail.type === "formula") {
    const amountMl = Math.max(0, Number(edits.amountMl) || 0);
    detail = { type: "formula", formula: { amountMl } };
  } else if (record.detail.type === "breast") {
    detail = {
      type: "breast",
      breast: {
        leftMinutes: Math.max(0, Number(edits.leftMinutes) || 0),
        rightMinutes: Math.max(0, Number(edits.rightMinutes) || 0),
      },
    };
  } else if (record.detail.type === "sleep") {
    const range = buildSleepRange({
      startHm: edits.sleepStartHm,
      endHm: edits.sleepEndHm,
      anchor: new Date(record.endedAt ?? record.recordedAt),
    });
    if (!range.ok) {
      return { ok: false, error: range.error };
    }
    startedAt = range.startedAt;
    endedAt = range.endedAt;
    recordedAt = range.endedAt;
    detail = {
      type: "sleep",
      sleep: {
        startedAt: range.startedAt,
        endedAt: range.endedAt,
        durationMinutes: range.durationMinutes,
      },
    };
  } else if (record.detail.type === "diaper") {
    detail = { type: "diaper", diaper: { kind: edits.diaperKind } };
  } else if (record.detail.type === "temperature") {
    detail = {
      type: "temperature",
      temperature: { celsius: Number(edits.celsius) || 0 },
    };
  }

  return { ok: true, patch: { note, detail, startedAt, endedAt, recordedAt } };
}

export function RecordDetailSheet({ record, onClose }: RecordDetailSheetProps) {
  if (!record) return null;
  return <RecordDetailEditor key={record.id} record={record} onClose={onClose} />;
}

function RecordDetailEditor({
  record,
  onClose,
}: {
  record: CareRecord;
  onClose: () => void;
}) {
  const { updateCareRecord, deleteCareRecord } = useAppData();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(record.note ?? "");
  const [amountMl, setAmountMl] = useState(
    record.detail.type === "formula"
      ? String(record.detail.formula.amountMl)
      : "",
  );
  const [leftMinutes, setLeftMinutes] = useState(
    record.detail.type === "breast"
      ? String(record.detail.breast.leftMinutes)
      : "",
  );
  const [rightMinutes, setRightMinutes] = useState(
    record.detail.type === "breast"
      ? String(record.detail.breast.rightMinutes)
      : "",
  );
  const [sleepStartHm, setSleepStartHm] = useState(
    record.detail.type === "sleep"
      ? jstHm(new Date(record.detail.sleep.startedAt))
      : "",
  );
  const [sleepEndHm, setSleepEndHm] = useState(
    record.detail.type === "sleep"
      ? jstHm(new Date(record.detail.sleep.endedAt ?? record.recordedAt))
      : "",
  );
  const [celsius, setCelsius] = useState(
    record.detail.type === "temperature"
      ? String(record.detail.temperature.celsius)
      : "",
  );
  const [diaperKind, setDiaperKind] = useState<DiaperKind>(
    record.detail.type === "diaper" ? record.detail.diaper.kind : "urine",
  );

  const saveEdits = async () => {
    const result = patchFromEdits(record, {
      note,
      amountMl,
      leftMinutes,
      rightMinutes,
      sleepStartHm,
      sleepEndHm,
      celsius,
      diaperKind,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    try {
      await updateCareRecord(record.id, result.patch);
      toast.success("記録を保存しました");
      setEditing(false);
    } catch {
      /* runRemote 側で toast */
    }
  };

  return (
    <Drawer
      open={Boolean(record)}
      onOpenChange={(open) => {
        if (!open) {
          setConfirmDelete(false);
          setEditing(false);
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
            {record.note && !editing ? (
              <p className="mt-2 text-sm text-muted-foreground">{record.note}</p>
            ) : null}

            {editing ? (
              <div className="mt-3 space-y-3">
                {record.detail.type === "formula" ? (
                  <div className="space-y-1">
                    <Label htmlFor="editAmount">ミルク量 (ml)</Label>
                    <Input
                      id="editAmount"
                      className="h-11"
                      inputMode="numeric"
                      value={amountMl}
                      onChange={(e) => setAmountMl(e.target.value)}
                    />
                  </div>
                ) : null}
                {record.detail.type === "breast" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="editLeft">左 (分)</Label>
                      <Input
                        id="editLeft"
                        className="h-11"
                        inputMode="numeric"
                        value={leftMinutes}
                        onChange={(e) => setLeftMinutes(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="editRight">右 (分)</Label>
                      <Input
                        id="editRight"
                        className="h-11"
                        inputMode="numeric"
                        value={rightMinutes}
                        onChange={(e) => setRightMinutes(e.target.value)}
                      />
                    </div>
                  </div>
                ) : null}
                {record.detail.type === "sleep" ? (
                  <SleepRangeFields
                    startHm={sleepStartHm}
                    endHm={sleepEndHm}
                    onStartChange={setSleepStartHm}
                    onEndChange={setSleepEndHm}
                    anchor={new Date(record.endedAt ?? record.recordedAt)}
                  />
                ) : null}
                {record.detail.type === "temperature" ? (
                  <div className="space-y-1">
                    <Label htmlFor="editTemp">体温 (℃)</Label>
                    <Input
                      id="editTemp"
                      className="h-11"
                      inputMode="decimal"
                      value={celsius}
                      onChange={(e) => setCelsius(e.target.value)}
                    />
                  </div>
                ) : null}
                {record.detail.type === "diaper" ? (
                  <div className="flex gap-2">
                    {(["urine", "stool", "both"] as const).map((kind) => (
                      <button
                        key={kind}
                        type="button"
                        className={`tap-target h-11 flex-1 rounded-xl border text-sm ${
                          diaperKind === kind
                            ? "border-primary bg-primary/30"
                            : "border-border bg-background"
                        }`}
                        onClick={() => setDiaperKind(kind)}
                      >
                        {kind === "urine"
                          ? "尿"
                          : kind === "stool"
                            ? "便"
                            : "両方"}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="space-y-1">
                  <Label htmlFor="editNote">メモ</Label>
                  <Input
                    id="editNote"
                    className="h-11"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            {editing ? (
              <Button
                type="button"
                className="tap-target h-11"
                onClick={() => void saveEdits()}
              >
                変更を保存
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="tap-target h-11"
                onClick={() => setEditing(true)}
              >
                編集する
              </Button>
            )}

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
