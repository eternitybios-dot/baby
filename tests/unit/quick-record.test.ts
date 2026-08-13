import { describe, expect, it } from "vitest";
import { timelinePrimaryText, timelineTimeText } from "@/lib/format";
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

    const sleep: CareRecord = {
      ...breast,
      id: "3",
      recordType: "sleep",
      startedAt: "2026-08-01T13:00:00.000+09:00",
      endedAt: "2026-08-01T14:30:00.000+09:00",
      detail: {
        type: "sleep",
        sleep: {
          startedAt: "2026-08-01T13:00:00.000+09:00",
          endedAt: "2026-08-01T14:30:00.000+09:00",
          durationMinutes: 90,
        },
      },
    };

    expect(timelinePrimaryText(breast)).toMatch(/母乳|授乳/);
    expect(timelinePrimaryText(diaper)).toMatch(/おむつ/);
    expect(timelinePrimaryText(sleep)).toBe("睡眠 13:00〜14:30");
    expect(timelineTimeText(sleep)).toBe("1時間30分");
  });

  it("削除後の配列から記録が消える", () => {
    const list = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const next = list.filter((r) => r.id !== "b");
    expect(next.map((r) => r.id)).toEqual(["a", "c"]);
    expect(next).toHaveLength(2);
  });
});
