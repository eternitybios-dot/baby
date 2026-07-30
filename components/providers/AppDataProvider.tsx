"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  createId,
  createSeedState,
  getCurrentProfile,
  loadAppState,
  saveAppState,
  toJstIso,
  type AppState,
} from "@/lib/data/app-state";
import {
  computeCharts,
  computeHomeStatus,
  computeTodaySummary,
  getTodayTimeline,
} from "@/lib/data/compute";
import type {
  Baby,
  CareRecord,
  CareRecordDetail,
  CareRecordType,
  ChartBundle,
  ChartPeriod,
  Concern,
  ConcernStatus,
  DiaperKind,
  GrowthPoint,
  Habit,
  HomeStatus,
  Profile,
  QuickRecordAction,
  TodaySummaryData,
} from "@/types/domain";

interface CreateCareInput {
  recordType: CareRecordType;
  recordedAt?: string;
  startedAt?: string | null;
  endedAt?: string | null;
  note?: string | null;
  detail: CareRecordDetail;
}

export interface QuickPayload {
  amountMl?: number;
  leftMinutes?: number;
  rightMinutes?: number;
  diaperKind?: DiaperKind;
  celsius?: number;
  concernTitle?: string;
  concernBody?: string;
}

interface AppDataContextValue {
  ready: boolean;
  now: Date;
  state: AppState;
  currentUser: Profile;
  baby: Baby;
  status: HomeStatus;
  summary: TodaySummaryData;
  timeline: CareRecord[];
  records: CareRecord[];
  growth: GrowthPoint[];
  concerns: Concern[];
  habits: Habit[];
  getCharts: (period: ChartPeriod) => ChartBundle;
  setCurrentUser: (userId: string) => void;
  updateBaby: (patch: Partial<Baby>) => void;
  addCareRecord: (input: CreateCareInput) => CareRecord;
  updateCareRecord: (id: string, patch: Partial<CareRecord>) => void;
  deleteCareRecord: (id: string) => void;
  quickSave: (
    action: QuickRecordAction,
    payload?: QuickPayload,
  ) => CareRecord | null;
  addGrowth: (input: Omit<GrowthPoint, "id">) => void;
  deleteGrowth: (id: string) => void;
  addConcern: (input: Omit<Concern, "id" | "recorder">) => void;
  updateConcern: (id: string, patch: Partial<Concern>) => void;
  deleteConcern: (id: string) => void;
  addHabit: (input: Omit<Habit, "id">) => void;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  resetDemoData: () => void;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

let memoryState: AppState = createSeedState();
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  memoryState = loadAppState();
}

function subscribe(listener: () => void) {
  ensureHydrated();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): AppState {
  ensureHydrated();
  return memoryState;
}

function getServerSnapshot(): AppState {
  return memoryState;
}

function commit(next: AppState) {
  memoryState = next;
  saveAppState(next);
  emit();
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = typeof window !== "undefined";
  const now = new Date();

  const patchState = useCallback((updater: (prev: AppState) => AppState) => {
    commit(updater(memoryState));
  }, []);

  const currentUser = getCurrentProfile(state);
  const status = useMemo(
    () => computeHomeStatus(state.records, now),
    [state.records, now],
  );
  const summary = useMemo(
    () => computeTodaySummary(state.records, now),
    [state.records, now],
  );
  const timeline = useMemo(
    () => getTodayTimeline(state.records, now),
    [state.records, now],
  );

  const value = useMemo<AppDataContextValue>(() => {
    return {
      ready,
      now,
      state,
      currentUser,
      baby: state.baby,
      status,
      summary,
      timeline,
      records: state.records,
      growth: state.growth,
      concerns: state.concerns,
      habits: state.habits,
      getCharts: (period) =>
        computeCharts(state.records, state.growth, period, now),
      setCurrentUser: (userId) => {
        patchState((prev) => ({ ...prev, currentUserId: userId }));
      },
      updateBaby: (babyPatch) => {
        patchState((prev) => ({
          ...prev,
          baby: { ...prev.baby, ...babyPatch, avatarUrl: null },
        }));
      },
      addCareRecord: (input) => {
        const recorder = getCurrentProfile(memoryState);
        const record: CareRecord = {
          id: createId("rec"),
          familyId: memoryState.baby.familyId,
          babyId: memoryState.baby.id,
          userId: recorder.id,
          recordType: input.recordType,
          recordedAt: input.recordedAt ?? toJstIso(),
          startedAt: input.startedAt ?? null,
          endedAt: input.endedAt ?? null,
          note: input.note ?? null,
          detail: input.detail,
          recorder,
        };
        patchState((prev) => ({
          ...prev,
          records: [record, ...prev.records],
        }));
        return record;
      },
      updateCareRecord: (id, recordPatch) => {
        patchState((prev) => ({
          ...prev,
          records: prev.records.map((r) =>
            r.id === id ? { ...r, ...recordPatch } : r,
          ),
        }));
      },
      deleteCareRecord: (id) => {
        patchState((prev) => ({
          ...prev,
          records: prev.records.filter((r) => r.id !== id),
        }));
      },
      quickSave: (action, payload = {}) => {
        const recorder = getCurrentProfile(memoryState);
        const nowIso = toJstIso();

        if (action === "sleep") {
          const open = memoryState.records.find(
            (r) =>
              r.recordType === "sleep" &&
              r.detail.type === "sleep" &&
              r.detail.sleep.endedAt == null,
          );
          if (open && open.detail.type === "sleep") {
            const endedAt = nowIso;
            const startedAt = open.detail.sleep.startedAt;
            const durationMinutes = Math.max(
              1,
              Math.round(
                (new Date(endedAt).getTime() - new Date(startedAt).getTime()) /
                  60000,
              ),
            );
            patchState((prev) => ({
              ...prev,
              records: prev.records.map((r) =>
                r.id === open.id
                  ? {
                      ...r,
                      endedAt,
                      detail: {
                        type: "sleep" as const,
                        sleep: { startedAt, endedAt, durationMinutes },
                      },
                    }
                  : r,
              ),
            }));
            return {
              ...open,
              endedAt,
              detail: {
                type: "sleep",
                sleep: { startedAt, endedAt, durationMinutes },
              },
            };
          }
          const record: CareRecord = {
            id: createId("rec"),
            familyId: memoryState.baby.familyId,
            babyId: memoryState.baby.id,
            userId: recorder.id,
            recordType: "sleep",
            recordedAt: nowIso,
            startedAt: nowIso,
            endedAt: null,
            note: null,
            detail: {
              type: "sleep",
              sleep: {
                startedAt: nowIso,
                endedAt: null,
                durationMinutes: null,
              },
            },
            recorder,
          };
          patchState((prev) => ({
            ...prev,
            records: [record, ...prev.records],
          }));
          return record;
        }

        if (action === "concern") {
          const concern: Concern = {
            id: createId("concern"),
            title: payload.concernTitle?.trim() || "困り事",
            category: "その他",
            body: payload.concernBody?.trim() || "詳細未記入",
            severity: 3,
            actionTaken: null,
            result: null,
            status: "open" satisfies ConcernStatus,
            occurredAt: nowIso,
            recorder,
          };
          patchState((prev) => ({
            ...prev,
            concerns: [concern, ...prev.concerns],
          }));
          return null;
        }

        const builders: Record<
          Exclude<QuickRecordAction, "sleep" | "concern">,
          () => CareRecord
        > = {
          formula: () => ({
            id: createId("rec"),
            familyId: memoryState.baby.familyId,
            babyId: memoryState.baby.id,
            userId: recorder.id,
            recordType: "formula",
            recordedAt: nowIso,
            startedAt: null,
            endedAt: null,
            note: null,
            detail: {
              type: "formula",
              formula: { amountMl: payload.amountMl ?? 120 },
            },
            recorder,
          }),
          breast: () => ({
            id: createId("rec"),
            familyId: memoryState.baby.familyId,
            babyId: memoryState.baby.id,
            userId: recorder.id,
            recordType: "breast",
            recordedAt: nowIso,
            startedAt: null,
            endedAt: null,
            note: null,
            detail: {
              type: "breast",
              breast: {
                leftMinutes: payload.leftMinutes ?? 8,
                rightMinutes: payload.rightMinutes ?? 6,
              },
            },
            recorder,
          }),
          diaper: () => ({
            id: createId("rec"),
            familyId: memoryState.baby.familyId,
            babyId: memoryState.baby.id,
            userId: recorder.id,
            recordType: "diaper",
            recordedAt: nowIso,
            startedAt: null,
            endedAt: null,
            note: null,
            detail: {
              type: "diaper",
              diaper: { kind: payload.diaperKind ?? "urine" },
            },
            recorder,
          }),
          temperature: () => ({
            id: createId("rec"),
            familyId: memoryState.baby.familyId,
            babyId: memoryState.baby.id,
            userId: recorder.id,
            recordType: "temperature",
            recordedAt: nowIso,
            startedAt: null,
            endedAt: null,
            note: null,
            detail: {
              type: "temperature",
              temperature: { celsius: payload.celsius ?? 36.5 },
            },
            recorder,
          }),
        };

        const record = builders[action]();
        patchState((prev) => ({
          ...prev,
          records: [record, ...prev.records],
        }));
        return record;
      },
      addGrowth: (input) => {
        patchState((prev) => ({
          ...prev,
          growth: [...prev.growth, { ...input, id: createId("growth") }].sort(
            (a, b) => a.measuredAt.localeCompare(b.measuredAt),
          ),
        }));
      },
      deleteGrowth: (id) => {
        patchState((prev) => ({
          ...prev,
          growth: prev.growth.filter((g) => g.id !== id),
        }));
      },
      addConcern: (input) => {
        const recorder = getCurrentProfile(memoryState);
        patchState((prev) => ({
          ...prev,
          concerns: [
            { ...input, id: createId("concern"), recorder },
            ...prev.concerns,
          ],
        }));
      },
      updateConcern: (id, concernPatch) => {
        patchState((prev) => ({
          ...prev,
          concerns: prev.concerns.map((c) =>
            c.id === id ? { ...c, ...concernPatch } : c,
          ),
        }));
      },
      deleteConcern: (id) => {
        patchState((prev) => ({
          ...prev,
          concerns: prev.concerns.filter((c) => c.id !== id),
        }));
      },
      addHabit: (input) => {
        patchState((prev) => ({
          ...prev,
          habits: [{ ...input, id: createId("habit") }, ...prev.habits],
        }));
      },
      updateHabit: (id, habitPatch) => {
        patchState((prev) => ({
          ...prev,
          habits: prev.habits.map((h) =>
            h.id === id ? { ...h, ...habitPatch } : h,
          ),
        }));
      },
      deleteHabit: (id) => {
        patchState((prev) => ({
          ...prev,
          habits: prev.habits.filter((h) => h.id !== id),
        }));
      },
      resetDemoData: () => {
        commit(createSeedState());
      },
    };
  }, [
    ready,
    now,
    state,
    currentUser,
    status,
    summary,
    timeline,
    patchState,
  ]);

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return ctx;
}
