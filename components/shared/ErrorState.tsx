import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
}

export function ErrorState({
  title = "読み込みに失敗しました",
  message,
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-2xl border border-destructive/20 bg-card px-6 py-8 text-center shadow-soft",
        className,
      )}
      role="alert"
    >
      <div
        className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive"
        aria-hidden
      >
        <AlertCircle className="size-7" strokeWidth={1.75} />
      </div>
      <div className="space-y-1">
        <p className="text-base font-medium text-foreground">{title}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>
      </div>
      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          className="tap-target min-h-11 px-4"
          onClick={onRetry}
          aria-label="再読み込み"
        >
          再試行
        </Button>
      ) : null}
      {action}
    </div>
  );
}
