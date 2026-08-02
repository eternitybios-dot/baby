import { describe, expect, it } from "vitest";
import { reconcileCareRecordsList } from "@/lib/data/records-list";
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

describe("reconcileCareRecordsList", () => {
  it("recent が limit 未満なら recent で置換し、削除済みを残さない", () => {
    const prev = [
      stubRecord("gone", "2026-08-02T12:00:00.000Z"),
      stubRecord("keep", "2026-08-02T11:00:00.000Z"),
    ];
    const recent = [stubRecord("keep", "2026-08-02T11:00:00.000Z")];
    const next = reconcileCareRecordsList(prev, recent, 120);
    expect(next.map((r) => r.id)).toEqual(["keep"]);
  });

  it("limit 満杯のとき、直近ウィンドウ外の古いページは残す", () => {
    const recent = [
      stubRecord("r1", "2026-08-02T12:00:00.000Z"),
      stubRecord("r2", "2026-08-02T11:00:00.000Z"),
    ];
    const prev = [
      ...recent,
      stubRecord("deleted-in-window", "2026-08-02T11:30:00.000Z"),
      stubRecord("older-page", "2026-08-02T10:00:00.000Z"),
    ];
    const next = reconcileCareRecordsList(prev, recent, 2);
    expect(next.map((r) => r.id)).toEqual(["r1", "r2", "older-page"]);
  });
});
