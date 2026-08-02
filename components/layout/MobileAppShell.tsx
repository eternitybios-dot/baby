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
import { ActivityNotificationWatcher } from "@/components/notifications/ActivityNotificationWatcher";
import { QuickRecordSheet } from "@/components/records/QuickRecordSheet";
import { RecordDetailSheet } from "@/components/records/RecordDetailSheet";
import {
  AppDataProvider,
  useAppData,
} from "@/components/providers/AppDataProvider";
import type { CareRecord, QuickRecordAction } from "@/types/domain";
import { cn } from "@/lib/utils";

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

  const overlayOpen = sheetOpen || detailRecord != null;

  return (
    <QuickRecordContext.Provider value={openSheet}>
      <RecordDetailContext.Provider value={setDetailRecord}>
        <ActivityNotificationWatcher />
        <div className="min-h-dvh bg-background">
          {/*
            Drawer の Backdrop が iOS PWA で効かないことがあるため、
            背面コンテンツ側に blur/dim をかけて確実にぼかす。
            シート本体は Portal で body 直下に出るのでぼけない。
          */}
          <div
            className={cn(
              "app-max-width relative min-h-dvh bg-background transition-[filter,opacity] duration-300",
              overlayOpen && "pointer-events-none blur-[2px]",
            )}
            aria-hidden={overlayOpen || undefined}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,_rgb(212_165_165_/_0.28),_transparent_70%)]"
              aria-hidden
            />
            <main className="relative px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
              {children}
            </main>
            <BottomNavigation onRecordPress={() => openSheet()} />
          </div>

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
