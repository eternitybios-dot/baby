"use client";

import { Baby as BabyIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import type { Baby } from "@/types/domain";
import { formatAgeInMonths } from "@/lib/date";
import { formatDisplayDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface BabyHeaderProps {
  baby: Baby;
  now: Date;
  syncing?: boolean;
  onRefresh?: () => Promise<void> | void;
  className?: string;
}

export function BabyHeader({
  baby,
  now,
  syncing = false,
  onRefresh,
  className,
}: BabyHeaderProps) {
  const ageLabel = formatAgeInMonths(new Date(baby.birthDate), now);

  return (
    <header
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-card/90 p-3 shadow-soft",
        className,
      )}
    >
      <div
        className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/25 ring-2 ring-primary/30"
        aria-hidden
      >
        <BabyIcon className="size-7 text-primary-foreground" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h1 className="truncate text-xl font-bold tracking-tight text-foreground">
            {baby.name}
          </h1>
          <span className="shrink-0 text-sm text-muted-foreground">
            生後{ageLabel}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {formatDisplayDate(now)}
        </p>
      </div>
      {onRefresh ? (
        <button
          type="button"
          className="tap-target flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground disabled:opacity-60"
          aria-label="再読み込み"
          disabled={syncing}
          onClick={() => {
            void (async () => {
              try {
                await onRefresh();
                toast.success("最新の記録を読み込みました");
              } catch {
                toast.error("再読み込みに失敗しました");
              }
            })();
          }}
        >
          <RefreshCw
            className={cn("size-5", syncing && "animate-spin")}
            strokeWidth={1.75}
            aria-hidden
          />
        </button>
      ) : null}
    </header>
  );
}
