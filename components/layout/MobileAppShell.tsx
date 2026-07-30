"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { QuickRecordSheet } from "@/components/records/QuickRecordSheet";
import type { QuickRecordAction } from "@/types/domain";

type OpenQuickRecord = (action?: QuickRecordAction) => void;

const QuickRecordContext = createContext<OpenQuickRecord>(() => undefined);

export function useQuickRecord(): OpenQuickRecord {
  return useContext(QuickRecordContext);
}

interface MobileAppShellProps {
  children: ReactNode;
}

export function MobileAppShell({ children }: MobileAppShellProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [initialAction, setInitialAction] = useState<QuickRecordAction | null>(
    null,
  );

  const openSheet: OpenQuickRecord = (action) => {
    setInitialAction(action ?? null);
    setSheetOpen(true);
  };

  return (
    <QuickRecordContext.Provider value={openSheet}>
      <div className="min-h-dvh bg-background">
        <div className="app-max-width relative min-h-dvh bg-background">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,_rgb(212_165_165_/_0.28),_transparent_70%)]"
            aria-hidden
          />
          <main className="relative px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
            {children}
          </main>
          <BottomNavigation onRecordPress={() => openSheet()} />
          {sheetOpen ? (
            <QuickRecordSheet
              key={initialAction ?? "menu"}
              open={sheetOpen}
              onOpenChange={setSheetOpen}
              initialAction={initialAction}
            />
          ) : null}
        </div>
      </div>
    </QuickRecordContext.Provider>
  );
}
