import { describe, expect, it } from "vitest";
import {
  buildCareRecordCursorFilter,
  quotePostgrestValue,
} from "@/lib/data/remote";

describe("記録ページングの複合カーソル", () => {
  it("時刻をクォートして + や : を壊さない", () => {
    const ts = "2026-08-01T10:00:00.000+09:00";
    expect(quotePostgrestValue(ts)).toBe(`"${ts}"`);
  });

  it("recorded_at + id の or フィルタを組み立てる", () => {
    const filter = buildCareRecordCursorFilter({
      recordedAt: "2026-08-01T10:00:00.000+09:00",
      id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    });
    expect(filter).toContain("recorded_at.lt.\"2026-08-01T10:00:00.000+09:00\"");
    expect(filter).toContain(
      "and(recorded_at.eq.\"2026-08-01T10:00:00.000+09:00\",id.lt.\"aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee\")",
    );
  });

  it("同時刻でも id で続きを取れる式になっている", () => {
    const filter = buildCareRecordCursorFilter({
      recordedAt: "2026-08-01T10:00:00.000Z",
      id: "id-2",
    });
    // 同じ時刻のより小さい id、またはより古い時刻
    expect(filter.startsWith("recorded_at.lt.")).toBe(true);
    expect(filter).toContain("id.lt.\"id-2\"");
  });
});
