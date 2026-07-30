"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { Toaster } from "sonner";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { FamilyGate } from "@/components/family/FamilyGate";
import { ConcernNotificationWatcher } from "@/components/notifications/ConcernNotificationWatcher";
import { QuickRecordSheet } from "@/components/records/QuickRecordSheet";
import { RecordDetailSheet } from "@/components/records/RecordDetailSheet";
import {
  AppDataProvider,
  useAppData,
} from "@/components/providers/AppDataProvider";
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

function AppShellContent({ children }: { children: ReactNode }) {
  const { ready } = useAppData();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [initialAction, setInitialAction] = useState<QuickRecordAction | null>(
    null,
  );
  const [detailRecord, setDetailRecord] = useState<CareRecord | null>(null);

  const openSheet: OpenQuickRecord = (action) => {
    setInitialAction(action ?? null);
    setSheetOpen(true);
  };

  if (!ready) {
    return (
      <>
        <FamilyGate />
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{ className: "font-sans" }}
        />
      </>
    );
  }

  return (
    <QuickRecordContext.Provider value={openSheet}>
      <RecordDetailContext.Provider value={setDetailRecord}>
        <ConcernNotificationWatcher />
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
  return (
    <AppDataProvider>
      <AppShellContent>{children}</AppShellContent>
    </AppDataProvider>
  );
}
