import type { CareRecord } from "@/types/domain";
import { TimelineItem } from "@/components/records/TimelineItem";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

interface TimelineProps {
  records: CareRecord[];
  title?: string;
  className?: string;
}

export function Timeline({
  records,
  title = "今日のタイムライン",
  className,
}: TimelineProps) {
  return (
    <section className={cn("space-y-3", className)} aria-label={title}>
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      {records.length === 0 ? (
        <EmptyState
          title="まだ今日の記録がありません"
          description="下の記録ボタンから、授乳やおむつをすばやく残せます"
        />
      ) : (
        <ol className="space-y-0">
          {records.map((record) => (
            <TimelineItem key={record.id} record={record} />
          ))}
        </ol>
      )}
    </section>
  );
}
