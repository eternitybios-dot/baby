import { describe, expect, it } from "vitest";
import { compareCareRecordsDesc } from "@/lib/data/compute";
import type { CareRecord } from "@/types/domain";

function stubRecord(id: string, recordedAt: string): CareRecord {
  return {
    id,
    familyId: "f1",
    babyId: "b1",
    userId: "u1",
    recorder: { id: "u1", displayName: "テスト", avatarUrl: null },
    recordType: "formula",
    recordedAt,
    startedAt: null,
    endedAt: null,
    note: null,
    detail: { type: "formula", formula: { amountMl: 100 } },
  };
}

describe("compareCareRecordsDesc", () => {
  it("recorded_at が新しければ先（DESC）", () => {
    const a = stubRecord("a", "2026-08-01T10:00:00.000Z");
    const b = stubRecord("b", "2026-08-01T11:00:00.000Z");
    expect(compareCareRecordsDesc(a, b)).toBeGreaterThan(0);
    expect(compareCareRecordsDesc(b, a)).toBeLessThan(0);
  });

  it("同時刻なら id DESC で安定ソートする", () => {
    const ts = "2026-08-01T10:00:00.000Z";
    const olderId = stubRecord("aaaaaaaa-0000-0000-0000-000000000001", ts);
    const newerId = stubRecord("bbbbbbbb-0000-0000-0000-000000000002", ts);
    expect(compareCareRecordsDesc(olderId, newerId)).toBeGreaterThan(0);
    expect(
      [olderId, newerId].sort(compareCareRecordsDesc).map((r) => r.id),
    ).toEqual([newerId.id, olderId.id]);
  });
});
