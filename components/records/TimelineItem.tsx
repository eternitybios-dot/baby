import {
  AlertTriangle,
  Baby,
  Droplets,
  Milk,
  Moon,
  Thermometer,
} from "lucide-react";
import type { CareRecord, CareRecordType } from "@/types/domain";
import { timelinePrimaryText, timelineTimeText } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<
  CareRecordType,
  { icon: typeof Milk; tone: string }
> = {
  breast: { icon: Baby, tone: "bg-primary/30 text-primary-foreground" },
  formula: { icon: Milk, tone: "bg-accent/70 text-accent-foreground" },
  pumped: { icon: Milk, tone: "bg-accent/50 text-accent-foreground" },
  solid: { icon: Baby, tone: "bg-soft-yellow/80 text-soft-yellow-foreground" },
  sleep: { icon: Moon, tone: "bg-secondary/50 text-secondary-foreground" },
  diaper: { icon: Droplets, tone: "bg-mint/60 text-mint-foreground" },
  temperature: { icon: Thermometer, tone: "bg-muted text-foreground" },
  medicine: { icon: Thermometer, tone: "bg-muted text-foreground" },
  symptom: { icon: AlertTriangle, tone: "bg-destructive/15 text-destructive" },
  clinic: { icon: AlertTriangle, tone: "bg-muted text-foreground" },
  bath: { icon: Droplets, tone: "bg-secondary/40 text-secondary-foreground" },
  other: { icon: Baby, tone: "bg-muted text-foreground" },
  concern: { icon: AlertTriangle, tone: "bg-destructive/15 text-destructive" },
};

interface TimelineItemProps {
  record: CareRecord;
}

export function TimelineItem({ record }: TimelineItemProps) {
  const meta = ICON_MAP[record.recordType];
  const Icon = meta.icon;

  return (
    <li className="relative flex gap-3 pb-4 last:pb-0">
      <div className="flex w-14 shrink-0 flex-col items-end pt-1">
        <time
          dateTime={record.recordedAt}
          className="text-xs font-medium tabular-nums text-muted-foreground"
        >
          {timelineTimeText(record)}
        </time>
      </div>
      <div className="relative flex flex-col items-center">
        <span
          className={cn(
            "z-10 flex size-10 items-center justify-center rounded-full shadow-soft",
            meta.tone,
          )}
          aria-hidden
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
        <span className="absolute top-10 bottom-0 w-px bg-border" aria-hidden />
      </div>
      <div className="min-w-0 flex-1 rounded-2xl bg-card p-3 shadow-soft">
        <p className="text-sm font-semibold text-foreground">
          {timelinePrimaryText(record)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          記録者: {record.recorder.displayName}
        </p>
      </div>
    </li>
  );
}
