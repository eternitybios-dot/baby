import { compareCareRecordsDesc } from "@/lib/data/compute";
import type { CareRecord } from "@/types/domain";

/**
 * ホーム直近ページ（recent）と既存一覧を突き合わせる。
 * recent に含まれない「直近ウィンドウ内」の ID は削除済みとみなし落とす。
 * recent が limit 未満なら、それが家族の全件なので置換する。
 */
export function reconcileCareRecordsList(
  prev: CareRecord[],
  recent: CareRecord[],
  recentLimit: number,
): CareRecord[] {
  if (recent.length < recentLimit) {
    return [...recent].sort(compareCareRecordsDesc);
  }

  const oldest = recent[recent.length - 1];
  if (!oldest) return [];

  const older = prev.filter((r) => compareCareRecordsDesc(r, oldest) > 0);
  return [...recent, ...older].sort(compareCareRecordsDesc);
}
