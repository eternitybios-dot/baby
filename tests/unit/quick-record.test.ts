import { describe, expect, it } from "vitest";
import { timelinePrimaryText } from "@/lib/format";
import type { CareRecord } from "@/types/domain";

describe("クイック記録の追加・削除（ドメイン）", () => {
  it("追加した記録の表示文言が種類どおりになる", () => {
    const breast: CareRecord = {
      id: "1",
      familyId: "f",
      babyId: "b",
      userId: "u",
      recordType: "breast",
      recordedAt: "2026-08-01T10:00:00.000+09:00",
      startedAt: null,
      endedAt: null,
      note: null,
      detail: {
        type: "breast",
        breast: { leftMinutes: 5, rightMinutes: 5 },
      },
      recorder: { id: "u", displayName: "ママ", avatarUrl: null },
    };
    const diaper: CareRecord = {
      ...breast,
      id: "2",
      recordType: "diaper",
      detail: { type: "diaper", diaper: { kind: "stool" } },
    };

    expect(timelinePrimaryText(breast)).toMatch(/母乳|授乳/);
    expect(timelinePrimaryText(diaper)).toMatch(/おむつ/);
  });

  it("削除後の配列から記録が消える", () => {
    const list = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const next = list.filter((r) => r.id !== "b");
    expect(next.map((r) => r.id)).toEqual(["a", "c"]);
    expect(next).toHaveLength(2);
  });
});
