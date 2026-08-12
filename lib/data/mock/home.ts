import type {
  Baby,
  CareRecord,
  ChartBundle,
  Concern,
  FamilySettings,
  GrowthPoint,
  Habit,
  HomeStatus,
  Profile,
  TodaySummaryData,
} from "@/types/domain";

export const MOCK_PROFILES = {
  mama: {
    id: "user-mama",
    displayName: "ママ",
    avatarUrl: null,
  },
  papa: {
    id: "user-papa",
    displayName: "パパ",
    avatarUrl: null,
  },
} as const satisfies Record<string, Profile>;

export const MOCK_BABY: Baby = {
  id: "baby-suzu",
  familyId: "family-1",
  name: "すず",
  nickname: "すずちゃん",
  birthDate: "2026-04-18",
  sex: "female",
  avatarUrl: null,
  birthWeightG: 3120,
  birthHeightCm: 49.5,
  memo: "よく笑う子です",
};

/** デモ表示の基準日時（JST 相当の固定時刻） */
export const MOCK_NOW_ISO = "2026-07-30T15:00:00+09:00";

export const MOCK_HOME_STATUS: HomeStatus = {
  lastFeedingAt: "2026-07-30T13:25:00+09:00", // 1時間35分前
  lastDiaperAt: "2026-07-30T14:15:00+09:00", // 45分前
  lastSleepAt: "2026-07-30T13:30:00+09:00",
  lastSleepMinutes: 80,
};

export const MOCK_TODAY_SUMMARY: TodaySummaryData = {
  feedingCount: 6,
  formulaMl: 620,
  sleepMinutes: 11 * 60 + 40,
  diaperCount: 8,
};

export const MOCK_TIMELINE: CareRecord[] = [
  {
    id: "rec-1",
    familyId: "family-1",
    babyId: "baby-suzu",
    userId: MOCK_PROFILES.mama.id,
    recordType: "formula",
    recordedAt: "2026-07-30T14:20:00+09:00",
    startedAt: null,
    endedAt: null,
    note: null,
    detail: { type: "formula", formula: { amountMl: 120 } },
    recorder: MOCK_PROFILES.mama,
  },
  {
    id: "rec-2",
    familyId: "family-1",
    babyId: "baby-suzu",
    userId: MOCK_PROFILES.papa.id,
    recordType: "diaper",
    recordedAt: "2026-07-30T13:45:00+09:00",
    startedAt: null,
    endedAt: null,
    note: null,
    detail: { type: "diaper", diaper: { kind: "urine" } },
    recorder: MOCK_PROFILES.papa,
  },
  {
    id: "rec-3",
    familyId: "family-1",
    babyId: "baby-suzu",
    userId: MOCK_PROFILES.mama.id,
    recordType: "sleep",
    recordedAt: "2026-07-30T12:10:00+09:00",
    startedAt: "2026-07-30T12:10:00+09:00",
    endedAt: "2026-07-30T13:30:00+09:00",
    note: null,
    detail: {
      type: "sleep",
      sleep: {
        startedAt: "2026-07-30T12:10:00+09:00",
        endedAt: "2026-07-30T13:30:00+09:00",
        durationMinutes: 80,
      },
    },
    recorder: MOCK_PROFILES.mama,
  },
  {
    id: "rec-4",
    familyId: "family-1",
    babyId: "baby-suzu",
    userId: MOCK_PROFILES.mama.id,
    recordType: "breast",
    recordedAt: "2026-07-30T11:45:00+09:00",
    startedAt: null,
    endedAt: null,
    note: null,
    detail: {
      type: "breast",
      breast: { leftMinutes: 8, rightMinutes: 6 },
    },
    recorder: MOCK_PROFILES.mama,
  },
  {
    id: "rec-5",
    familyId: "family-1",
    babyId: "baby-suzu",
    userId: MOCK_PROFILES.papa.id,
    recordType: "diaper",
    recordedAt: "2026-07-30T10:30:00+09:00",
    startedAt: null,
    endedAt: null,
    note: null,
    detail: { type: "diaper", diaper: { kind: "both" } },
    recorder: MOCK_PROFILES.papa,
  },
];

const WEEK_LABELS = ["木", "金", "土", "日", "月", "火", "水"] as const;
const WEEK_DATES = [
  "2026-07-24",
  "2026-07-25",
  "2026-07-26",
  "2026-07-27",
  "2026-07-28",
  "2026-07-29",
  "2026-07-30",
] as const;

function weekPoints(values: number[]) {
  return WEEK_DATES.map((date, index) => ({
    date,
    label: WEEK_LABELS[index],
    value: values[index] ?? 0,
  }));
}

export const MOCK_CHARTS_7D: ChartBundle = {
  sleepHours: weekPoints([12.5, 11.2, 13.0, 10.8, 12.1, 11.6, 11.7]),
  feedingCounts: weekPoints([8, 7, 9, 8, 7, 8, 6]),
  formulaMl: weekPoints([640, 580, 700, 620, 560, 680, 620]),
  diaperCounts: weekPoints([9, 8, 10, 7, 8, 9, 8]),
  weightKg: weekPoints([5.8, 5.82, 5.85, 5.88, 5.9, 5.92, 5.95]),
};

export const MOCK_CHARTS_30D: ChartBundle = {
  sleepHours: Array.from({ length: 30 }, (_, i) => ({
    date: `2026-07-${String(i + 1).padStart(2, "0")}`,
    label: `${i + 1}`,
    value: 10.5 + ((i * 7) % 25) / 10,
  })),
  feedingCounts: Array.from({ length: 30 }, (_, i) => ({
    date: `2026-07-${String(i + 1).padStart(2, "0")}`,
    label: `${i + 1}`,
    value: 6 + (i % 4),
  })),
  formulaMl: Array.from({ length: 30 }, (_, i) => ({
    date: `2026-07-${String(i + 1).padStart(2, "0")}`,
    label: `${i + 1}`,
    value: 520 + (i % 5) * 40,
  })),
  diaperCounts: Array.from({ length: 30 }, (_, i) => ({
    date: `2026-07-${String(i + 1).padStart(2, "0")}`,
    label: `${i + 1}`,
    value: 6 + (i % 5),
  })),
  weightKg: Array.from({ length: 30 }, (_, i) => ({
    date: `2026-07-${String(i + 1).padStart(2, "0")}`,
    label: `${i + 1}`,
    value: 5.4 + i * 0.02,
  })),
};

export const MOCK_GROWTH: GrowthPoint[] = [
  {
    id: "g1",
    measuredAt: "2026-04-18",
    weightG: 3120,
    heightCm: 49.5,
    headCircumferenceCm: 34.0,
    note: "出生時",
  },
  {
    id: "g2",
    measuredAt: "2026-05-18",
    weightG: 4200,
    heightCm: 53.0,
    headCircumferenceCm: 36.2,
    note: "1か月健診",
  },
  {
    id: "g3",
    measuredAt: "2026-06-18",
    weightG: 5100,
    heightCm: 56.5,
    headCircumferenceCm: 38.0,
    note: null,
  },
  {
    id: "g4",
    measuredAt: "2026-07-18",
    weightG: 5950,
    heightCm: 59.0,
    headCircumferenceCm: 39.5,
    note: "3か月健診",
  },
];

export const MOCK_CONCERNS: Concern[] = [
  {
    id: "c1",
    title: "夕方のぐずりが長い",
    category: "機嫌",
    body: "17時前後に30分以上泣くことが多い",
    severity: 3,
    actionTaken: "抱っこ・散歩",
    result: "少し落ち着くが再発あり",
    status: "watching",
    occurredAt: "2026-07-28T17:20:00+09:00",
    recorder: MOCK_PROFILES.mama,
  },
  {
    id: "c2",
    title: "おしりの赤み",
    category: "皮膚",
    body: "おむつ替えのたびに少し赤い",
    severity: 2,
    actionTaken: "保湿と通気",
    result: null,
    status: "in_progress",
    occurredAt: "2026-07-29T09:10:00+09:00",
    recorder: MOCK_PROFILES.papa,
  },
];

export const MOCK_HABITS: Habit[] = [
  {
    id: "h1",
    name: "授乳前に手をしゃぶる",
    category: "授乳",
    body: "お腹が空くと左手をよくしゃぶる",
    likelyTimeOfDay: "授乳の直前",
    frequency: "ほぼ毎回",
    effectiveResponse: "早めに授乳を始める",
    lastConfirmedAt: "2026-07-29",
    status: "active",
  },
  {
    id: "h2",
    name: "寝る前に白雑音",
    category: "睡眠",
    body: "扇風機の音があると寝付きが良い",
    likelyTimeOfDay: "夜の就寝前",
    frequency: "毎晩",
    effectiveResponse: "弱めの白雑音を5分",
    lastConfirmedAt: "2026-07-30",
    status: "active",
  },
];

export const MOCK_FAMILY: FamilySettings = {
  familyName: "すずの家族",
  inviteCode: "SUZU26",
  members: [
    { ...MOCK_PROFILES.mama, role: "owner" },
    { ...MOCK_PROFILES.papa, role: "member" },
  ],
};
