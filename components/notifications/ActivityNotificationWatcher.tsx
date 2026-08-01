"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAppData } from "@/components/providers/AppDataProvider";
import { timelinePrimaryText } from "@/lib/format";
import {
  getNotificationPref,
  notifyNewCareRecord,
  notifyNewConcern,
  notifyNewGrowth,
  notifyNewHabit,
  wasLocalCreated,
} from "@/lib/notifications";

/**
 * 相手が追加した入力内容を検知してトースト / OS 通知を出す
 */
export function ActivityNotificationWatcher() {
  const { ready, records, concerns, growth, habits, currentUser, baby } =
    useAppData();
  const knownRef = useRef<{
    familyId: string;
    records: Set<string>;
    concerns: Set<string>;
    growth: Set<string>;
    habits: Set<string>;
  } | null>(null);

  useEffect(() => {
    if (!ready) return;

    const familyId = baby.familyId;
    const next = {
      familyId,
      records: new Set(records.map((r) => r.id)),
      concerns: new Set(concerns.map((c) => c.id)),
      growth: new Set(growth.map((g) => g.id)),
      habits: new Set(habits.map((h) => h.id)),
    };
    const known = knownRef.current;

    // 家族切替時は既知 ID をリセット（誤通知防止）
    if (known === null || known.familyId !== familyId) {
      knownRef.current = next;
      return;
    }

    const osOn = getNotificationPref();

    for (const record of records) {
      if (known.records.has(record.id) || wasLocalCreated(record.id)) continue;
      if (record.userId === currentUser.id || record.recorder.id === currentUser.id) {
        continue;
      }
      const primary = timelinePrimaryText(record);
      toast.message(primary, {
        description: `${record.recorder.displayName}が記録しました`,
      });
      if (osOn) notifyNewCareRecord(record);
    }

    for (const concern of concerns) {
      if (known.concerns.has(concern.id) || wasLocalCreated(concern.id)) continue;
      if (concern.recorder.id === currentUser.id) continue;
      toast.message(`困り事: ${concern.title}`, {
        description: `${concern.recorder.displayName}が追加しました`,
      });
      if (osOn) notifyNewConcern(concern);
    }

    for (const point of growth) {
      if (known.growth.has(point.id) || wasLocalCreated(point.id)) continue;
      const detail = [
        point.weightG != null ? `体重 ${(point.weightG / 1000).toFixed(2)}kg` : null,
        point.heightCm != null ? `身長 ${point.heightCm}cm` : null,
        point.headCircumferenceCm != null
          ? `頭囲 ${point.headCircumferenceCm}cm`
          : null,
      ]
        .filter(Boolean)
        .join("・");
      toast.message("成長記録", {
        description: detail || "新しい計測が追加されました",
      });
      if (osOn) notifyNewGrowth(point, "家族");
    }

    for (const habit of habits) {
      if (known.habits.has(habit.id) || wasLocalCreated(habit.id)) continue;
      toast.message(`習慣: ${habit.name}`, {
        description: habit.body || "新しい習慣が追加されました",
      });
      if (osOn) notifyNewHabit(habit, "家族");
    }

    knownRef.current = next;
  }, [ready, records, concerns, growth, habits, currentUser.id, baby.familyId]);

  return null;
}
