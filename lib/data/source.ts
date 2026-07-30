import {
  MOCK_BABY,
  MOCK_CHARTS_30D,
  MOCK_CHARTS_7D,
  MOCK_CONCERNS,
  MOCK_FAMILY,
  MOCK_GROWTH,
  MOCK_HABITS,
  MOCK_HOME_STATUS,
  MOCK_NOW_ISO,
  MOCK_TIMELINE,
  MOCK_TODAY_SUMMARY,
} from "@/lib/data/mock/home";
import type {
  Baby,
  CareRecord,
  ChartBundle,
  ChartPeriod,
  Concern,
  FamilySettings,
  GrowthPoint,
  Habit,
  HomeStatus,
  TodaySummaryData,
} from "@/types/domain";

/**
 * データ取得の抽象。現状はモックを返す。
 * 後続で Supabase 実装に差し替える。
 */
export interface CareDataSource {
  getBaby(): Promise<Baby>;
  getHomeStatus(): Promise<HomeStatus>;
  getTodaySummary(): Promise<TodaySummaryData>;
  getTodayTimeline(): Promise<CareRecord[]>;
  getCharts(period: ChartPeriod): Promise<ChartBundle>;
  getGrowthRecords(): Promise<GrowthPoint[]>;
  getConcerns(): Promise<Concern[]>;
  getHabits(): Promise<Habit[]>;
  getFamilySettings(): Promise<FamilySettings>;
  getReferenceNow(): Promise<Date>;
}

const delay = async (ms = 0): Promise<void> => {
  if (ms <= 0) return;
  await new Promise((resolve) => setTimeout(resolve, ms));
};

export class MockCareDataSource implements CareDataSource {
  constructor(private readonly latencyMs = 0) {}

  async getBaby(): Promise<Baby> {
    await delay(this.latencyMs);
    return MOCK_BABY;
  }

  async getHomeStatus(): Promise<HomeStatus> {
    await delay(this.latencyMs);
    return MOCK_HOME_STATUS;
  }

  async getTodaySummary(): Promise<TodaySummaryData> {
    await delay(this.latencyMs);
    return MOCK_TODAY_SUMMARY;
  }

  async getTodayTimeline(): Promise<CareRecord[]> {
    await delay(this.latencyMs);
    return MOCK_TIMELINE;
  }

  async getCharts(period: ChartPeriod): Promise<ChartBundle> {
    await delay(this.latencyMs);
    if (period === "30d") return MOCK_CHARTS_30D;
    // custom も当面 7 日サンプルを返す（UI の期間指定は後続で接続）
    return MOCK_CHARTS_7D;
  }

  async getGrowthRecords(): Promise<GrowthPoint[]> {
    await delay(this.latencyMs);
    return MOCK_GROWTH;
  }

  async getConcerns(): Promise<Concern[]> {
    await delay(this.latencyMs);
    return MOCK_CONCERNS;
  }

  async getHabits(): Promise<Habit[]> {
    await delay(this.latencyMs);
    return MOCK_HABITS;
  }

  async getFamilySettings(): Promise<FamilySettings> {
    await delay(this.latencyMs);
    return MOCK_FAMILY;
  }

  async getReferenceNow(): Promise<Date> {
    return new Date(MOCK_NOW_ISO);
  }
}

/** アプリ全体で使うデータソース（将来 SupabaseCareDataSource に置換） */
export const careDataSource: CareDataSource = new MockCareDataSource();
