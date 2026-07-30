import { Baby as BabyIcon } from "lucide-react";
import type { Baby } from "@/types/domain";
import { formatAgeInMonths } from "@/lib/date";
import { formatDisplayDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface BabyHeaderProps {
  baby: Baby;
  now: Date;
  className?: string;
}

export function BabyHeader({ baby, now, className }: BabyHeaderProps) {
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
        {baby.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={baby.avatarUrl}
            alt=""
            className="size-full object-cover"
          />
        ) : (
          <BabyIcon className="size-7 text-primary-foreground" strokeWidth={1.75} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
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
    </header>
  );
}
