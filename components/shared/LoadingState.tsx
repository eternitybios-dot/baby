import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  label?: string;
  className?: string;
  rows?: number;
}

export function LoadingState({
  label = "読み込み中",
  className,
  rows = 3,
}: LoadingStateProps) {
  return (
    <div
      className={cn("space-y-3", className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <p className="sr-only">{label}</p>
      {Array.from({ length: rows }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl bg-card p-4 shadow-soft"
        >
          <Skeleton className="mb-3 h-4 w-1/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}
