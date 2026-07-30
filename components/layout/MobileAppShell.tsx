"use client";

import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Toaster } from "sonner";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { QuickRecordSheet } from "@/components/records/QuickRecordSheet";
import { RecordDetailSheet } from "@/components/records/RecordDetailSheet";
import { AppDataProvider } from "@/components/providers/AppDataProvider";
import { LoadingState } from "@/components/shared/LoadingState";
import type { CareRecord, QuickRecordAction } from "@/types/domain";

type OpenQuickRecord = (action?: QuickRecordAction) => void;

const QuickRecordContext = createContext<OpenQuickRecord>(() => undefined);
const RecordDetailContext = createContext<(record: CareRecord) => void>(
  () => undefined,
);

export function useQuickRecord(): OpenQuickRecord {
  return useContext(QuickRecordContext);
}

export function useOpenRecordDetail() {
  return useContext(RecordDetailContext);
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

function ShellInner({ children }: { children: ReactNode }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [initialAction, setInitialAction] = useState<QuickRecordAction | null>(
    null,
  );
  const [detailRecord, setDetailRecord] = useState<CareRecord | null>(null);

  const openSheet: OpenQuickRecord = (action) => {
    setInitialAction(action ?? null);
    setSheetOpen(true);
  };

  return (
    <QuickRecordContext.Provider value={openSheet}>
      <RecordDetailContext.Provider value={setDetailRecord}>
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
            <RecordDetailSheet
              record={detailRecord}
              onClose={() => setDetailRecord(null)}
            />
            <Toaster
              position="top-center"
              richColors
              closeButton
              toastOptions={{ className: "font-sans" }}
            />
          </div>
        </div>
      </RecordDetailContext.Provider>
    </QuickRecordContext.Provider>
  );
}

export function MobileAppShell({ children }: { children: ReactNode }) {
  const isClient = useIsClient();

  return (
    <AppDataProvider>
      {!isClient ? (
        <div className="app-max-width px-4 pt-8">
          <LoadingState label="すくすくログを準備中" rows={4} />
        </div>
      ) : (
        <ShellInner>{children}</ShellInner>
      )}
    </AppDataProvider>
  );
}
