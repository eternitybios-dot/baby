import {
  MOCK_BABY,
  MOCK_CONCERNS,
  MOCK_FAMILY,
  MOCK_GROWTH,
  MOCK_HABITS,
  MOCK_PROFILES,
  MOCK_TIMELINE,
} from "@/lib/data/mock/home";
import type {
  Baby,
  CareRecord,
  Concern,
  FamilySettings,
  GrowthPoint,
  Habit,
  Profile,
} from "@/types/domain";

export const APP_STORAGE_KEY = "sukusuku-log:v2";

export interface AppState {
  version: 2;
  baby: Baby;
  family: FamilySettings;
  currentUserId: string;
  records: CareRecord[];
  growth: GrowthPoint[];
  concerns: Concern[];
  habits: Habit[];
}

function shiftIsoToToday(iso: string, now = new Date()): string {
  const original = new Date(iso);
  const today = jstYmd(now);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(original);
  return new Date(`${today}T${time}+09:00`).toISOString();
}

export function createSeedState(now = new Date()): AppState {
  const birth = new Date(now);
  birth.setMonth(birth.getMonth() - 3);
  birth.setDate(birth.getDate() - 12);

  return {
    version: 2,
    baby: {
      ...MOCK_BABY,
      avatarUrl: null,
      birthDate: jstYmd(birth),
    },
    family: {
      ...MOCK_FAMILY,
      members: MOCK_FAMILY.members.map((m) => ({ ...m, avatarUrl: null })),
    },
    currentUserId: MOCK_PROFILES.mama.id,
    records: MOCK_TIMELINE.map((r) => {
      const recordedAt = shiftIsoToToday(r.recordedAt, now);
      const startedAt = r.startedAt ? shiftIsoToToday(r.startedAt, now) : null;
      const endedAt = r.endedAt ? shiftIsoToToday(r.endedAt, now) : null;
      let detail = r.detail;
      if (detail.type === "sleep") {
        detail = {
          type: "sleep",
          sleep: {
            startedAt: shiftIsoToToday(detail.sleep.startedAt, now),
            endedAt: detail.sleep.endedAt
              ? shiftIsoToToday(detail.sleep.endedAt, now)
              : null,
            durationMinutes: detail.sleep.durationMinutes,
          },
        };
      }
      return {
        ...r,
        recordedAt,
        startedAt,
        endedAt,
        detail,
        recorder: { ...r.recorder, avatarUrl: null },
      };
    }),
    growth: [...MOCK_GROWTH],
    concerns: MOCK_CONCERNS.map((c) => ({
      ...c,
      occurredAt: shiftIsoToToday(c.occurredAt, now),
      recorder: { ...c.recorder, avatarUrl: null },
    })),
    habits: [...MOCK_HABITS],
  };
}

export function getProfiles(state: AppState): Profile[] {
  return state.family.members.map((member) => ({
    id: member.id,
    displayName: member.displayName,
    avatarUrl: member.avatarUrl,
  }));
}

export function getCurrentProfile(state: AppState): Profile {
  const found = getProfiles(state).find((p) => p.id === state.currentUserId);
  return found ?? getProfiles(state)[0];
}

export function loadAppState(): AppState {
  if (typeof window === "undefined") return createSeedState();
  try {
    const raw = window.localStorage.getItem(APP_STORAGE_KEY);
    if (!raw) {
      const seed = createSeedState();
      window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== 2 || !parsed.baby || !Array.isArray(parsed.records)) {
      const seed = createSeedState();
      window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    return parsed;
  } catch {
    const seed = createSeedState();
    window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

export function saveAppState(state: AppState): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function toJstIso(date: Date = new Date()): string {
  // 保存は ISO。表示側で JST 変換する
  return date.toISOString();
}

export function startOfJstDay(date: Date): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const ymd = formatter.format(date); // yyyy-mm-dd
  return new Date(`${ymd}T00:00:00+09:00`);
}

export function jstYmd(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
