import { careDataSource } from "@/lib/data/source";
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

/** UI から呼ぶデータ取得 API（実装詳細を隠蔽） */

export async function fetchBaby(): Promise<Baby> {
  return careDataSource.getBaby();
}

export async function fetchHomeStatus(): Promise<HomeStatus> {
  return careDataSource.getHomeStatus();
}

export async function fetchTodaySummary(): Promise<TodaySummaryData> {
  return careDataSource.getTodaySummary();
}

export async function fetchTodayTimeline(): Promise<CareRecord[]> {
  return careDataSource.getTodayTimeline();
}

export async function fetchCharts(period: ChartPeriod): Promise<ChartBundle> {
  return careDataSource.getCharts(period);
}

export async function fetchGrowthRecords(): Promise<GrowthPoint[]> {
  return careDataSource.getGrowthRecords();
}

export async function fetchConcerns(): Promise<Concern[]> {
  return careDataSource.getConcerns();
}

export async function fetchHabits(): Promise<Habit[]> {
  return careDataSource.getHabits();
}

export async function fetchFamilySettings(): Promise<FamilySettings> {
  return careDataSource.getFamilySettings();
}

export async function fetchReferenceNow(): Promise<Date> {
  return careDataSource.getReferenceNow();
}
