"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useAppData } from "@/components/providers/AppDataProvider";
import {
  getNotificationPref,
  notifyNewConcern,
} from "@/lib/notifications";

/**
 * 相手が追加した困り事を検知してトースト / OS 通知を出す
 */
export function ConcernNotificationWatcher() {
  const { ready, concerns, currentUser } = useAppData();
  const knownIdsRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!ready) return;

    const currentIds = new Set(concerns.map((c) => c.id));
    const known = knownIdsRef.current;

    if (known === null) {
      knownIdsRef.current = currentIds;
      return;
    }

    const newcomers = concerns.filter(
      (c) => !known.has(c.id) && c.recorder.id !== currentUser.id,
    );

    for (const concern of newcomers) {
      toast.message(`困り事: ${concern.title}`, {
        description: `${concern.recorder.displayName}が追加しました`,
      });
      if (getNotificationPref()) {
        notifyNewConcern(concern);
      }
    }

    knownIdsRef.current = currentIds;
  }, [ready, concerns, currentUser.id]);

  return null;
}
