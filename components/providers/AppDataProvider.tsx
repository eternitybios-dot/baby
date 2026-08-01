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
  chartPeriodRange,
  computeCharts,
  computeHomeStatus,
  computeTodaySummary,
  getTodayTimeline,
} from "@/lib/data/compute";
import {
  applyProfileDisplayName,
  buildProfileMapFromState,
  CARE_RECORDS_PAGE_SIZE,
  createFamilyWithBaby,
  ensureAnonymousSession,
  fetchCareRecordsInRange,
  fetchCareRecordsPage,
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
import {
  appPath,
  enableNotifications,
  ensureServiceWorker,
  getNotificationPref,
  getPushRegisteredPref,
  markLocalCreated,
  notifyFamilyPush,
  savePushSubscription,
  type EnableNotificationsResult,
} from "@/lib/notifications";
import { timelinePrimaryText } from "@/lib/format";
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
  chartPeriod: ChartPeriod;
  setChartPeriod: (period: ChartPeriod) => void;
  chartsLoading: boolean;
  recordsList: CareRecord[];
  hasMoreRecords: boolean;
  loadingMoreRecords: boolean;
  loadMoreRecords: () => Promise<void>;
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
  openConfig: () => void;
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
  enableDeviceNotifications: () => Promise<EnableNotificationsResult>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

function withErrorMessage(error: unknown): string {
  let message = "不明なエラーが発生しました";
  if (error instanceof Error) message = error.message;
  else if (typeof error === "object" && error && "message" in error) {
    message = String((error as { message: unknown }).message);
  }

  const lower = message.toLowerCase();
  if (lower.includes("anonymous") || lower.includes("signups not allowed")) {
    return "匿名ログインが無効です。Supabase の Authentication → Providers → Anonymous を ON にしてください。";
  }
  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return "サーバーに届きません。Project URL が正しいか、ネット接続を確認してください。";
  }
  if (lower.includes("invalid api key") || lower.includes("jwt")) {
    return "anon key が正しくないようです。Supabase の Project Settings → API からコピーし直してください。";
  }
  return message;
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
  const [chartPeriod, setChartPeriodState] = useState<ChartPeriod>("7d");
  const [chartRecords, setChartRecords] = useState<CareRecord[]>([]);
  const [chartsLoading, setChartsLoading] = useState(false);
  const [recordsList, setRecordsList] = useState<CareRecord[]>([]);
  const [hasMoreRecords, setHasMoreRecords] = useState(false);
  const [loadingMoreRecords, setLoadingMoreRecords] = useState(false);
  const startedRef = useRef(false);

  const supabaseRef = useRef<SupabaseClient | null>(null);
  const userIdRef = useRef<string>("");
  const familyIdRef = useRef<string>("");
  const stateRef = useRef(state);
  const chartPeriodRef = useRef(chartPeriod);
  const recordsListRef = useRef(recordsList);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    chartPeriodRef.current = chartPeriod;
  }, [chartPeriod]);

  useEffect(() => {
    recordsListRef.current = recordsList;
  }, [recordsList]);

  const applyState = useCallback((next: AppState) => {
    setState(next);
    stateRef.current = next;
  }, []);

  const loadChartRecords = useCallback(
    async (period: ChartPeriod) => {
      const supabase = supabaseRef.current;
      const familyId = familyIdRef.current || stateRef.current.baby.familyId;
      if (!supabase || !familyId) return;
      setChartsLoading(true);
      try {
        const { fromIso, toIso } = chartPeriodRange(period, new Date());
        const rows = await fetchCareRecordsInRange(supabase, {
          familyId,
          profileById: buildProfileMapFromState(stateRef.current),
          fromIso,
          toIso,
        });
        setChartRecords(rows);
      } catch {
        /* ホームの recent でフォールバック */
        setChartRecords(stateRef.current.records);
      } finally {
        setChartsLoading(false);
      }
    },
    [],
  );

  const reloadBundle = useCallback(async () => {
    const supabase = supabaseRef.current;
    const userId = userIdRef.current;
    if (!supabase || !userId) return;

    const previousFamilyId = familyIdRef.current;
    const bundle = await fetchFamilyBundle(supabase, userId);
    if (!bundle || !bundle.baby.id) {
      familyIdRef.current = bundle?.family.familyId ?? "";
      applyState(bundle ?? createEmptyState());
      setRecordsList([]);
      setHasMoreRecords(false);
      setChartRecords([]);
      setBootPhase("needs_family");
      return;
    }

    const nextFamilyId =
      bundle.baby.familyId || bundle.family.familyId || "";
    familyIdRef.current = nextFamilyId;
    applyState(bundle);
    setBootPhase("ready");
    setBootError(null);

    // 家族切替時は一覧・既知状態をリセット
    if (previousFamilyId && previousFamilyId !== nextFamilyId) {
      setRecordsList(bundle.records);
      setHasMoreRecords(bundle.records.length >= CARE_RECORDS_PAGE_SIZE);
    } else if (recordsListRef.current.length === 0) {
      setRecordsList(bundle.records);
      setHasMoreRecords(bundle.records.length >= CARE_RECORDS_PAGE_SIZE);
    } else {
      // ホーム recent と一覧の先頭をマージ（新しい記録を反映）
      setRecordsList((prev) => {
        const byId = new Map(prev.map((r) => [r.id, r]));
        for (const r of bundle.records) byId.set(r.id, r);
        return [...byId.values()].sort((a, b) =>
          b.recordedAt.localeCompare(a.recordedAt),
        );
      });
    }

    void loadChartRecords(chartPeriodRef.current);
  }, [applyState, loadChartRecords]);

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

    const memberIds = state.family.members.map((m) => m.id);
    const unsubscribe = subscribeFamilyRealtime(supabase, {
      familyId,
      memberIds,
      onChange: schedule,
      onProfileUpdate: (userId, displayName) => {
        applyState(
          applyProfileDisplayName(stateRef.current, userId, displayName),
        );
        setRecordsList((prev) =>
          prev.map((r) =>
            r.userId === userId || r.recorder.id === userId
              ? { ...r, recorder: { ...r.recorder, displayName } }
              : r,
          ),
        );
        setChartRecords((prev) =>
          prev.map((r) =>
            r.userId === userId || r.recorder.id === userId
              ? { ...r, recorder: { ...r.recorder, displayName } }
              : r,
          ),
        );
      },
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [
    bootPhase,
    state.baby.familyId,
    state.family.members,
    reloadBundle,
    applyState,
  ]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  // iOS PWA: Service Worker を早めに登録し、通知ONなら Push 購読を保存
  useEffect(() => {
    if (bootPhase !== "ready") return;
    void ensureServiceWorker();

    const onSwMessage = (event: MessageEvent) => {
      if (event.data?.type !== "SW_UPDATED") return;
      const key = "sukusuku-sw-reload";
      if (sessionStorage.getItem(key) === event.data.version) return;
      sessionStorage.setItem(key, event.data.version);
      window.location.reload();
    };
    navigator.serviceWorker?.addEventListener("message", onSwMessage);

    if (getNotificationPref() && !getPushRegisteredPref()) {
      const supabase = supabaseRef.current;
      const familyId = familyIdRef.current || state.baby.familyId;
      const userId = userIdRef.current;
      if (supabase && familyId && userId) {
        void savePushSubscription(supabase, familyId, userId);
      }
    }

    return () => {
      navigator.serviceWorker?.removeEventListener("message", onSwMessage);
    };
  }, [bootPhase, state.baby.familyId]);

  const pushToFamily = useCallback(
    (title: string, body: string, path: string) => {
      const supabase = supabaseRef.current;
      const familyId = familyIdRef.current || stateRef.current.baby.familyId;
      const userId = userIdRef.current;
      if (!supabase || !familyId || !userId) return;
      void notifyFamilyPush(supabase, {
        familyId,
        title,
        body,
        url: appPath(path),
        excludeUserId: userId,
      }).then((result) => {
        if (!result.ok) {
          toast.message("記録は保存しました", {
            description: "相手への通知だけ送れませんでした",
          });
        }
      });
    },
    [],
  );

  const loadMoreRecords = useCallback(async () => {
    const supabase = supabaseRef.current;
    const familyId = familyIdRef.current || stateRef.current.baby.familyId;
    if (!supabase || !familyId || loadingMoreRecords || !hasMoreRecords) return;
    setLoadingMoreRecords(true);
    try {
      const oldest = recordsListRef.current.at(-1)?.recordedAt ?? null;
      const page = await fetchCareRecordsPage(supabase, {
        familyId,
        profileById: buildProfileMapFromState(stateRef.current),
        limit: CARE_RECORDS_PAGE_SIZE,
        beforeRecordedAt: oldest,
      });
      setRecordsList((prev) => {
        const seen = new Set(prev.map((r) => r.id));
        const merged = [...prev];
        for (const row of page) {
          if (!seen.has(row.id)) merged.push(row);
        }
        return merged;
      });
      setHasMoreRecords(page.length >= CARE_RECORDS_PAGE_SIZE);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "記録の追加読み込みに失敗しました",
      );
    } finally {
      setLoadingMoreRecords(false);
    }
  }, [hasMoreRecords, loadingMoreRecords]);

  const setChartPeriod = useCallback(
    (period: ChartPeriod) => {
      setChartPeriodState(period);
      void loadChartRecords(period);
    },
    [loadChartRecords],
  );

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
        computeCharts(
          chartRecords.length > 0 ? chartRecords : state.records,
          state.growth,
          period,
          now,
        ),
      chartPeriod,
      setChartPeriod,
      chartsLoading,
      recordsList: recordsList.length > 0 ? recordsList : state.records,
      hasMoreRecords,
      loadingMoreRecords,
      loadMoreRecords,
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
        markLocalCreated(record.id);
        applyState({
          ...stateRef.current,
          records: [record, ...stateRef.current.records],
        });
        setRecordsList((prev) => [record, ...prev.filter((r) => r.id !== record.id)]);
        setChartRecords((prev) => [record, ...prev.filter((r) => r.id !== record.id)]);
        void runRemote(async () => {
          await insertCareRecordRemote(supabaseRef.current!, record);
          pushToFamily(
            timelinePrimaryText(record),
            `${record.recorder.displayName}が記録しました`,
            "/home",
          );
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
        setRecordsList((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...recordPatch } : r)),
        );
        setChartRecords((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...recordPatch } : r)),
        );
        void runRemote(async () => {
          await updateCareRecordRemote(supabaseRef.current!, id, recordPatch);
        });
      },
      deleteCareRecord: (id) => {
        applyState({
          ...stateRef.current,
          records: stateRef.current.records.filter((r) => r.id !== id),
        });
        setRecordsList((prev) => prev.filter((r) => r.id !== id));
        setChartRecords((prev) => prev.filter((r) => r.id !== id));
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
          markLocalCreated(record.id);
          applyState({
            ...stateRef.current,
            records: [record, ...stateRef.current.records],
          });
          setRecordsList((prev) => [
            record,
            ...prev.filter((r) => r.id !== record.id),
          ]);
          setChartRecords((prev) => [
            record,
            ...prev.filter((r) => r.id !== record.id),
          ]);
          void runRemote(async () => {
            await insertCareRecordRemote(supabaseRef.current!, record);
            pushToFamily(
              timelinePrimaryText(record),
              `${record.recorder.displayName}が記録しました`,
              "/home",
            );
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
          markLocalCreated(concern.id);
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
            pushToFamily(
              `困り事: ${concern.title}`,
              `${concern.recorder.displayName}が追加しました`,
              "/concerns",
            );
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
        markLocalCreated(record.id);
        applyState({
          ...stateRef.current,
          records: [record, ...stateRef.current.records],
        });
        setRecordsList((prev) => [
          record,
          ...prev.filter((r) => r.id !== record.id),
        ]);
        setChartRecords((prev) => [
          record,
          ...prev.filter((r) => r.id !== record.id),
        ]);
        void runRemote(async () => {
          await insertCareRecordRemote(supabaseRef.current!, record);
          pushToFamily(
            timelinePrimaryText(record),
            `${record.recorder.displayName}が記録しました`,
            "/home",
          );
        });
        return record;
      },
      addGrowth: (input) => {
        const id = createId();
        markLocalCreated(id);
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
          const parts = [
            input.weightG != null ? `体重 ${(input.weightG / 1000).toFixed(2)}kg` : null,
            input.heightCm != null ? `身長 ${input.heightCm}cm` : null,
          ].filter(Boolean);
          pushToFamily("成長記録", parts.join("・") || "新しい計測", "/growth");
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
        markLocalCreated(id);
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
          pushToFamily(
            `困り事: ${input.title}`,
            `${recorder.displayName}が追加しました`,
            "/concerns",
          );
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
        markLocalCreated(id);
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
          pushToFamily(`習慣: ${input.name}`, input.body || "新しい習慣", "/habits");
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
      openConfig: () => {
        resetSupabaseClient();
        supabaseRef.current = null;
        userIdRef.current = "";
        familyIdRef.current = "";
        setBootError(null);
        setBootPhase("needs_config");
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
        const config = resolveSupabaseConfig();
        if (!config) {
          setBootPhase("needs_config");
          return;
        }
        if (bootPhase === "error" || !supabaseRef.current || !userIdRef.current) {
          await bootstrap(config);
          return;
        }
        try {
          setBootPhase("loading");
          await reloadBundle();
        } catch (error) {
          setBootError(withErrorMessage(error));
          setBootPhase("error");
        }
      },
      enableDeviceNotifications: async () => {
        const supabase = supabaseRef.current;
        const familyId = familyIdRef.current || stateRef.current.baby.familyId;
        const userId = userIdRef.current;
        return enableNotifications({
          supabase,
          familyId,
          userId,
        });
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
    chartRecords,
    chartPeriod,
    setChartPeriod,
    chartsLoading,
    recordsList,
    hasMoreRecords,
    loadingMoreRecords,
    loadMoreRecords,
    applyState,
    runRemote,
    bootstrap,
    reloadBundle,
    pushToFamily,
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
