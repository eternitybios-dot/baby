import { describe, expect, it } from "vitest";
import { applyProfileDisplayName } from "@/lib/data/remote";
import type { AppState } from "@/lib/data/app-state";
import type { CareRecord } from "@/types/domain";

function baseState(): AppState {
  const record: CareRecord = {
    id: "r1",
    familyId: "fam",
    babyId: "baby",
    userId: "partner",
    recordType: "formula",
    recordedAt: "2026-08-01T10:00:00.000+09:00",
    startedAt: null,
    endedAt: null,
    note: null,
    detail: { type: "formula", formula: { amountMl: 100 } },
    recorder: { id: "partner", displayName: "旧名", avatarUrl: null },
  };

  return {
    version: 2,
    currentUserId: "me",
    baby: {
      id: "baby",
      familyId: "fam",
      name: "赤ちゃん",
      nickname: null,
      birthDate: "2026-01-01",
      sex: "unspecified",
      avatarUrl: null,
      birthWeightG: null,
      birthHeightCm: null,
      memo: null,
    },
    family: {
      familyId: "fam",
      familyName: "わが家",
      inviteCode: "ABC123",
      members: [
        { id: "me", displayName: "ママ", avatarUrl: null, role: "owner" },
        { id: "partner", displayName: "旧名", avatarUrl: null, role: "member" },
      ],
    },
    records: [record],
    growth: [],
    concerns: [
      {
        id: "c1",
        title: "ぐずり",
        category: "睡眠",
        body: "夕方",
        severity: 3,
        actionTaken: null,
        result: null,
        status: "open",
        occurredAt: "2026-08-01T10:00:00.000+09:00",
        recorder: { id: "partner", displayName: "旧名", avatarUrl: null },
      },
    ],
    habits: [],
  };
}

describe("表示名変更の Realtime 反映", () => {
  it("相手の表示名変更が members / records / concerns に反映される", () => {
    const next = applyProfileDisplayName(baseState(), "partner", "パパ");
    expect(
      next.family.members.find((m) => m.id === "partner")?.displayName,
    ).toBe("パパ");
    expect(next.records[0]?.recorder.displayName).toBe("パパ");
    expect(next.concerns[0]?.recorder.displayName).toBe("パパ");
    expect(next.family.members.find((m) => m.id === "me")?.displayName).toBe(
      "ママ",
    );
  });
});
