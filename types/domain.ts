/** ドメイン型定義（Supabase 置き換え時も同じ形状を維持） */

export type FamilyRole = "owner" | "member";

export type CareRecordType =
  | "breast"
  | "formula"
  | "pumped"
  | "solid"
  | "sleep"
  | "diaper"
  | "temperature"
  | "medicine"
  | "symptom"
  | "clinic"
  | "bath"
  | "other"
  | "concern";

export type DiaperKind = "urine" | "stool" | "both";

export type ConcernStatus = "open" | "in_progress" | "watching" | "resolved";

export type HabitStatus = "active" | "inactive";

export type ChartPeriod = "7d" | "30d" | "custom";

export interface Profile {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface Baby {
  id: string;
  familyId: string;
  name: string;
  nickname: string | null;
  birthDate: string; // yyyy-MM-dd
  sex: "female" | "male" | "other" | "unspecified";
  avatarUrl: string | null;
  birthWeightG: number | null;
  birthHeightCm: number | null;
  memo: string | null;
}

export interface HomeStatus {
  lastFormulaAt: string; // ISO
  lastDiaperAt: string;
  isSleeping: boolean;
  sleepStartedAt: string | null;
}

export interface TodaySummaryData {
  feedingCount: number;
  formulaMl: number;
  sleepMinutes: number;
  diaperCount: number;
}

export interface BreastDetail {
  leftMinutes: number;
  rightMinutes: number;
}

export interface FormulaDetail {
  amountMl: number;
}

export interface SleepDetail {
  startedAt: string;
  endedAt: string | null;
  durationMinutes: number | null;
}

export interface DiaperDetail {
  kind: DiaperKind;
}

export interface TemperatureDetail {
  celsius: number;
}

export type CareRecordDetail =
  | { type: "breast"; breast: BreastDetail }
  | { type: "formula"; formula: FormulaDetail }
  | { type: "sleep"; sleep: SleepDetail }
  | { type: "diaper"; diaper: DiaperDetail }
  | { type: "temperature"; temperature: TemperatureDetail }
  | { type: "concern"; title: string }
  | { type: "other"; label: string };

export interface CareRecord {
  id: string;
  familyId: string;
  babyId: string;
  userId: string;
  recordType: CareRecordType;
  recordedAt: string;
  startedAt: string | null;
  endedAt: string | null;
  note: string | null;
  detail: CareRecordDetail;
  recorder: Profile;
}

export interface DailyMetricPoint {
  date: string; // yyyy-MM-dd
  label: string; // 表示用（例: 月）
  value: number;
}

export interface GrowthPoint {
  id: string;
  measuredAt: string;
  weightG: number | null;
  heightCm: number | null;
  headCircumferenceCm: number | null;
  note: string | null;
}

export interface Concern {
  id: string;
  title: string;
  category: string;
  body: string;
  severity: 1 | 2 | 3 | 4 | 5;
  actionTaken: string | null;
  result: string | null;
  status: ConcernStatus;
  occurredAt: string;
  recorder: Profile;
}

export interface Habit {
  id: string;
  name: string;
  category: string;
  body: string;
  likelyTimeOfDay: string;
  frequency: string;
  effectiveResponse: string | null;
  lastConfirmedAt: string | null;
  status: HabitStatus;
}

export interface ChartBundle {
  sleepHours: DailyMetricPoint[];
  feedingCounts: DailyMetricPoint[];
  formulaMl: DailyMetricPoint[];
  diaperCounts: DailyMetricPoint[];
  weightKg: DailyMetricPoint[];
}

export interface FamilySettings {
  familyName: string;
  inviteCode: string;
  members: Array<Profile & { role: FamilyRole }>;
}

export type QuickRecordAction =
  | "breast"
  | "formula"
  | "sleep"
  | "diaper"
  | "temperature"
  | "concern";

export interface AsyncResult<T> {
  data: T;
  error: Error | null;
  isLoading: boolean;
}
