"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PinkNavHeaderProps {
  title: string;
  onPrev: () => void;
  onNext: () => void;
  prevLabel: string;
  nextLabel: string;
  subtitle?: string;
  trailing?: ReactNode;
  className?: string;
}

export function PinkNavHeader({
  title,
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  subtitle,
  trailing,
  className,
}: PinkNavHeaderProps) {
  return (
    <header
      className={cn(
        "-mx-4 -mt-[max(0.75rem,env(safe-area-inset-top))] bg-primary px-2 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] text-primary-foreground",
        className,
      )}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onPrev}
          className="tap-target flex size-11 shrink-0 items-center justify-center rounded-full text-primary-foreground/90 transition hover:bg-primary-foreground/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-foreground/40"
          aria-label={prevLabel}
        >
          <ChevronLeft className="size-6" strokeWidth={2.25} aria-hidden />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <p className="truncate text-base font-semibold tabular-nums tracking-wide">
            {title}
          </p>
          {subtitle ? (
            <p className="truncate text-xs text-primary-foreground/80">
              {subtitle}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onNext}
          className="tap-target flex size-11 shrink-0 items-center justify-center rounded-full text-primary-foreground/90 transition hover:bg-primary-foreground/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-foreground/40"
          aria-label={nextLabel}
        >
          <ChevronRight className="size-6" strokeWidth={2.25} aria-hidden />
        </button>
        {trailing}
      </div>
    </header>
  );
}
