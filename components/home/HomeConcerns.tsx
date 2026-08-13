"use client";

import Link from "next/link";
import { BookHeart, ChevronRight, HeartHandshake, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuickRecord } from "@/components/layout/MobileAppShell";
import type { Concern, ConcernStatus } from "@/types/domain";
import { formatClock, formatDisplayDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<ConcernStatus, string> = {
  open: "未対応",
  in_progress: "対応中",
  watching: "様子見",
  resolved: "解決",
};

const ACTIVE: ConcernStatus[] = ["open", "in_progress", "watching"];

interface HomeConcernsProps {
  concerns: Concern[];
  className?: string;
}

export function HomeConcerns({ concerns, className }: HomeConcernsProps) {
  const openQuick = useQuickRecord();
  const active = concerns
    .filter((c) => ACTIVE.includes(c.status))
    .slice(0, 5);

  return (
    <section className={cn("space-y-3", className)} aria-label="育児日記">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
          <BookHeart className="size-4 text-primary" aria-hidden />
          育児日記
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="tap-target flex size-9 items-center justify-center rounded-full text-primary transition hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
            aria-label="育児日記を書く"
            onClick={() => openQuick("concern")}
          >
            <Pencil className="size-4" strokeWidth={1.75} aria-hidden />
          </button>
          <Link
            href="/concerns"
            className="tap-target inline-flex items-center gap-0.5 text-xs font-medium text-muted-foreground"
            aria-label="困り事一覧へ"
          >
            すべて見る
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
      {active.length === 0 ? (
        <p className="rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground shadow-soft">
          今日の様子はまだありません
        </p>
      ) : (
        <ul className="space-y-2">
          {active.map((item) => (
            <li key={item.id}>
              <Link
                href="/concerns"
                className="tap-target flex items-start gap-3 rounded-2xl bg-card px-4 py-3 shadow-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40"
              >
                <span
                  className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/25 text-primary-foreground"
                  aria-hidden
                >
                  <HeartHandshake className="size-4" strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {item.title}
                    </span>
                    <Badge variant="secondary" className="shrink-0">
                      {STATUS_LABEL[item.status]}
                    </Badge>
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
                    {item.body}
                  </span>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {formatDisplayDate(item.occurredAt)}{" "}
                    {formatClock(item.occurredAt)} ／ {item.recorder.displayName}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
