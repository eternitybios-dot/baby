"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  createEmptyState,
  createId,
  getCurrentProfile,
  toJstIso,
  type AppState,
} from "@/lib/data/app-state";
import {
  computeCharts,
  computeHomeStatus,
  computeTodaySummary,
  getTodayTimeline,
} from "@/lib/data/compute";
import {
  createFamilyWithBaby,
  ensureAnonymousSession,
  fetchFamilyBundle,
  insertCareRecordRemote,
  insertConcernRemote,
  insertGrowthRemote,
  insertHabitRemote,
  joinFamilyWithCode,
  softDeleteCareRecord,
  softDeleteConcern,
  softDeleteGrowth,
  softDeleteHabit,
  subscribeFamilyRealtime,
  updateBabyRemote,
  updateCareRecordRemote,
  updateConcernRemote,
  updateHabitRemote,
  updateProfileName,
} from "@/lib/data/remote";
import {
  resolveSupabaseConfig,
  saveStoredSupabaseConfig,
  type SupabaseConfig,
} from "@/lib/supabase/config";
import { getSupabaseClient, resetSupabaseClient } from "@/lib/supabase/client";
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
  sleepMinutes?: number;
}

export type BootPhase =
  | "loading"
  | "needs_config"
  | "needs_family"
  | "ready"
  | "error";

interface AppDataContextValue {
  ready: boolean;
  bootPhase: BootPhase;
  bootError: string | null;
  syncing: boolean;
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
  updateDisplayName: (displayName: string) => Promise<void>;
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
  saveSupabaseConfig: (config: SupabaseConfig) => Promise<void>;
  createFamily: (input: {
    familyName: string;
    displayName: string;
    babyName: string;
    birthDate: string;
  }) => Promise<void>;
  joinFamily: (input: {
    inviteCode: string;
    displayName: string;
  }) => Promise<void>;
  refresh: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function withErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "不明なエラーが発生しました";
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [bootPhase, setBootPhase] = useState<BootPhase>(() => {
    if (typeof window === "undefined") return "loading";
    return resolveSupabaseConfig() ? "loading" : "needs_config";
  });
  const [bootError, setBootError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [state, setState] = useState<AppState>(() => createEmptyState());
  const [now, setNow] = useState(() => new Date());
  const startedRef = useRef(false);

  const supabaseRef = useRef<SupabaseClient | null>(null);
  const userIdRef = useRef<string>("");
  const familyIdRef = useRef<string>("");
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const applyState = useCallback((next: AppState) => {
    setState(next);
    stateRef.current = next;
  }, []);

  const reloadBundle = useCallback(async () => {
    const supabase = supabaseRef.current;
    const userId = userIdRef.current;
    if (!supabase || !userId) return;

    const bundle = await fetchFamilyBundle(supabase, userId);
    if (!bundle || !bundle.baby.id) {
      familyIdRef.current = bundle?.family.familyId ?? "";
      applyState(bundle ?? createEmptyState());
      setBootPhase("needs_family");
      return;
    }

    familyIdRef.current =
      bundle.baby.familyId || bundle.family.familyId || "";
    applyState(bundle);
    setBootPhase("ready");
    setBootError(null);
  }, [applyState]);

  const bootstrap = useCallback(async (config: SupabaseConfig) => {
    setBootPhase("loading");
    setBootError(null);
    try {
      resetSupabaseClient();
      const supabase = getSupabaseClient(config);
      supabaseRef.current = supabase;
      const { userId } = await ensureAnonymousSession(supabase);
      userIdRef.current = userId;
      await reloadBundle();
    } catch (error) {
      setBootError(withErrorMessage(error));
      setBootPhase("error");
    }
  }, [reloadBundle]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    const config = resolveSupabaseConfig();
    if (!config) return;
    // マウント時のサーバー接続（意図的な初期化）
    // eslint-disable-next-line react-hooks/set-state-in-effect -- bootstrap on mount
    void bootstrap(config);
  }, [bootstrap]);

  useEffect(() => {
    if (bootPhase !== "ready") return;
    const familyId = familyIdRef.current;
    const supabase = supabaseRef.current;
    if (!familyId || !supabase) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void reloadBundle().catch(() => {
          /* ignore transient realtime reload errors */
        });
      }, 250);
    };

    const unsubscribe = subscribeFamilyRealtime(supabase, familyId, schedule);
    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [bootPhase, state.baby.familyId, reloadBundle]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const runRemote = useCallback(async (task: () => Promise<void>) => {
    const supabase = supabaseRef.current;
    if (!supabase) {
      toast.error("サーバーに接続されていません");
      return;
    }
    setSyncing(true);
    try {
      await task();
    } catch (error) {
      toast.error(withErrorMessage(error));
      try {
        await reloadBundle();
      } catch {
        /* ignore */
      }
    } finally {
      setSyncing(false);
    }
  }, [reloadBundle]);

  const currentUser = useMemo(() => {
    if (!state.currentUserId) {
      return { id: "", displayName: "メンバー", avatarUrl: null };
    }
    try {
      return getCurrentProfile(state);
    } catch {
      return {
        id: state.currentUserId,
        displayName: "メンバー",
        avatarUrl: null,
      };
    }
  }, [state]);

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
      ready: bootPhase === "ready",
      bootPhase,
      bootError,
      syncing,
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
      setCurrentUser: () => {
        toast.message("記録者は端末ごとに固定です。表示名は設定から変更できます。");
      },
      updateDisplayName: async (displayName) => {
        const name = displayName.trim();
        if (!name) {
          toast.error("表示名を入力してください");
          return;
        }
        const userId = userIdRef.current;
        applyState({
          ...stateRef.current,
          family: {
            ...stateRef.current.family,
            members: stateRef.current.family.members.map((m) =>
              m.id === userId ? { ...m, displayName: name } : m,
            ),
          },
        });
        await runRemote(async () => {
          await updateProfileName(supabaseRef.current!, userId, name);
        });
      },
      updateBaby: (babyPatch) => {
        const nextBaby = {
          ...stateRef.current.baby,
          ...babyPatch,
          avatarUrl: null,
        };
        applyState({ ...stateRef.current, baby: nextBaby });
        void runRemote(async () => {
          await updateBabyRemote(
            supabaseRef.current!,
            stateRef.current.baby.id,
            babyPatch,
          );
        });
      },
      addCareRecord: (input) => {
        const recorder = currentUser;
        const record: CareRecord = {
          id: createId(),
          familyId: stateRef.current.baby.familyId,
          babyId: stateRef.current.baby.id,
          userId: recorder.id,
          recordType: input.recordType,
          recordedAt: input.recordedAt ?? toJstIso(),
          startedAt: input.startedAt ?? null,
          endedAt: input.endedAt ?? null,
          note: input.note ?? null,
          detail: input.detail,
          recorder,
        };
        applyState({
          ...stateRef.current,
          records: [record, ...stateRef.current.records],
        });
        void runRemote(async () => {
          await insertCareRecordRemote(supabaseRef.current!, record);
        });
        return record;
      },
      updateCareRecord: (id, recordPatch) => {
        applyState({
          ...stateRef.current,
          records: stateRef.current.records.map((r) =>
            r.id === id ? { ...r, ...recordPatch } : r,
          ),
        });
        void runRemote(async () => {
          await updateCareRecordRemote(supabaseRef.current!, id, recordPatch);
        });
      },
      deleteCareRecord: (id) => {
        applyState({
          ...stateRef.current,
          records: stateRef.current.records.filter((r) => r.id !== id),
        });
        void runRemote(async () => {
          await softDeleteCareRecord(supabaseRef.current!, id);
        });
      },
      quickSave: (action, payload = {}) => {
        const recorder = currentUser;
        const nowIso = toJstIso();
        const base = {
          familyId: stateRef.current.baby.familyId,
          babyId: stateRef.current.baby.id,
          userId: recorder.id,
          recorder,
        };

        if (action === "sleep") {
          const durationMinutes = Math.max(1, Math.round(payload.sleepMinutes ?? 60));
          const endedAt = nowIso;
          const startedAt = new Date(
            new Date(endedAt).getTime() - durationMinutes * 60_000,
          ).toISOString();
          const record: CareRecord = {
            id: createId(),
            ...base,
            recordType: "sleep",
            recordedAt: endedAt,
            startedAt,
            endedAt,
            note: null,
            detail: {
              type: "sleep",
              sleep: { startedAt, endedAt, durationMinutes },
            },
          };
          applyState({
            ...stateRef.current,
            records: [record, ...stateRef.current.records],
          });
          void runRemote(async () => {
            await insertCareRecordRemote(supabaseRef.current!, record);
          });
          return record;
        }

        if (action === "concern") {
          const concern: Concern = {
            id: createId(),
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
          applyState({
            ...stateRef.current,
            concerns: [concern, ...stateRef.current.concerns],
          });
          void runRemote(async () => {
            await insertConcernRemote(supabaseRef.current!, {
              id: concern.id,
              familyId: base.familyId,
              babyId: base.babyId,
              userId: base.userId,
              title: concern.title,
              category: concern.category,
              body: concern.body,
              severity: concern.severity,
              actionTaken: concern.actionTaken,
              result: concern.result,
              status: concern.status,
              occurredAt: concern.occurredAt,
            });
          });
          return null;
        }

        const builders: Record<
          Exclude<QuickRecordAction, "sleep" | "concern">,
          () => CareRecord
        > = {
          formula: () => ({
            id: createId(),
            ...base,
            recordType: "formula",
            recordedAt: nowIso,
            startedAt: null,
            endedAt: null,
            note: null,
            detail: {
              type: "formula",
              formula: { amountMl: payload.amountMl ?? 120 },
            },
          }),
          breast: () => ({
            id: createId(),
            ...base,
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
          }),
          diaper: () => ({
            id: createId(),
            ...base,
            recordType: "diaper",
            recordedAt: nowIso,
            startedAt: null,
            endedAt: null,
            note: null,
            detail: {
              type: "diaper",
              diaper: { kind: payload.diaperKind ?? "urine" },
            },
          }),
          temperature: () => ({
            id: createId(),
            ...base,
            recordType: "temperature",
            recordedAt: nowIso,
            startedAt: null,
            endedAt: null,
            note: null,
            detail: {
              type: "temperature",
              temperature: { celsius: payload.celsius ?? 36.5 },
            },
          }),
        };

        const record = builders[action]();
        applyState({
          ...stateRef.current,
          records: [record, ...stateRef.current.records],
        });
        void runRemote(async () => {
          await insertCareRecordRemote(supabaseRef.current!, record);
        });
        return record;
      },
      addGrowth: (input) => {
        const id = createId();
        applyState({
          ...stateRef.current,
          growth: [...stateRef.current.growth, { ...input, id }].sort((a, b) =>
            a.measuredAt.localeCompare(b.measuredAt),
          ),
        });
        void runRemote(async () => {
          await insertGrowthRemote(supabaseRef.current!, {
            id,
            familyId: stateRef.current.baby.familyId,
            babyId: stateRef.current.baby.id,
            userId: userIdRef.current,
            measuredAt: input.measuredAt,
            weightG: input.weightG,
            heightCm: input.heightCm,
            headCircumferenceCm: input.headCircumferenceCm,
            note: input.note,
          });
        });
      },
      deleteGrowth: (id) => {
        applyState({
          ...stateRef.current,
          growth: stateRef.current.growth.filter((g) => g.id !== id),
        });
        void runRemote(async () => {
          await softDeleteGrowth(supabaseRef.current!, id);
        });
      },
      addConcern: (input) => {
        const recorder = currentUser;
        const id = createId();
        applyState({
          ...stateRef.current,
          concerns: [{ ...input, id, recorder }, ...stateRef.current.concerns],
        });
        void runRemote(async () => {
          await insertConcernRemote(supabaseRef.current!, {
            id,
            familyId: stateRef.current.baby.familyId,
            babyId: stateRef.current.baby.id,
            userId: recorder.id,
            title: input.title,
            category: input.category,
            body: input.body,
            severity: input.severity,
            actionTaken: input.actionTaken,
            result: input.result,
            status: input.status,
            occurredAt: input.occurredAt,
          });
        });
      },
      updateConcern: (id, concernPatch) => {
        applyState({
          ...stateRef.current,
          concerns: stateRef.current.concerns.map((c) =>
            c.id === id ? { ...c, ...concernPatch } : c,
          ),
        });
        void runRemote(async () => {
          await updateConcernRemote(supabaseRef.current!, id, concernPatch);
        });
      },
      deleteConcern: (id) => {
        applyState({
          ...stateRef.current,
          concerns: stateRef.current.concerns.filter((c) => c.id !== id),
        });
        void runRemote(async () => {
          await softDeleteConcern(supabaseRef.current!, id);
        });
      },
      addHabit: (input) => {
        const id = createId();
        applyState({
          ...stateRef.current,
          habits: [{ ...input, id }, ...stateRef.current.habits],
        });
        void runRemote(async () => {
          await insertHabitRemote(supabaseRef.current!, {
            id,
            familyId: stateRef.current.baby.familyId,
            babyId: stateRef.current.baby.id,
            userId: userIdRef.current,
            name: input.name,
            category: input.category,
            body: input.body,
            likelyTimeOfDay: input.likelyTimeOfDay,
            frequency: input.frequency,
            effectiveResponse: input.effectiveResponse,
            lastConfirmedAt: input.lastConfirmedAt,
            status: input.status,
          });
        });
      },
      updateHabit: (id, habitPatch) => {
        applyState({
          ...stateRef.current,
          habits: stateRef.current.habits.map((h) =>
            h.id === id ? { ...h, ...habitPatch } : h,
          ),
        });
        void runRemote(async () => {
          await updateHabitRemote(supabaseRef.current!, id, habitPatch);
        });
      },
      deleteHabit: (id) => {
        applyState({
          ...stateRef.current,
          habits: stateRef.current.habits.filter((h) => h.id !== id),
        });
        void runRemote(async () => {
          await softDeleteHabit(supabaseRef.current!, id);
        });
      },
      saveSupabaseConfig: async (config) => {
        saveStoredSupabaseConfig(config);
        await bootstrap(config);
      },
      createFamily: async (input) => {
        const supabase = supabaseRef.current;
        if (!supabase) throw new Error("サーバー未接続です");
        setSyncing(true);
        try {
          await createFamilyWithBaby(supabase, input);
          await reloadBundle();
          toast.success("家族を作成しました。招待コードを相手に伝えてください");
        } finally {
          setSyncing(false);
        }
      },
      joinFamily: async (input) => {
        const supabase = supabaseRef.current;
        if (!supabase) throw new Error("サーバー未接続です");
        setSyncing(true);
        try {
          await joinFamilyWithCode(supabase, input);
          await reloadBundle();
          toast.success("家族に参加しました");
        } finally {
          setSyncing(false);
        }
      },
      refresh: async () => {
        await reloadBundle();
      },
    };
  }, [
    bootPhase,
    bootError,
    syncing,
    now,
    state,
    currentUser,
    status,
    summary,
    timeline,
    applyState,
    runRemote,
    bootstrap,
    reloadBundle,
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
