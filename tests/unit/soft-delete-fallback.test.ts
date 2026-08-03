import { describe, expect, it, vi } from "vitest";

/**
 * deleteRowWithFallback は remote.ts の非公開関数のため、
 * 公開 softDeleteConcern の契約（成功時に throw しない）を軽く担保する。
 * 実 DB なしではクライアント呼び出しをモックする。
 */
describe("softDeleteConcern fallback contract", () => {
  it("soft select が空でも hard delete が成功すれば完了する", async () => {
    const softSelect = vi.fn().mockResolvedValue({ data: [], error: null });
    const hardSelect = vi
      .fn()
      .mockResolvedValue({ data: [{ id: "c1" }], error: null });

    const softEq = vi.fn(() => ({
      is: vi.fn(() => ({ select: softSelect })),
    }));
    const softUpdate = vi.fn(() => ({ eq: softEq }));

    const hardEq = vi.fn(() => ({ select: hardSelect }));
    const hardDelete = vi.fn(() => ({ eq: hardEq }));

    const from = vi.fn((table: string) => {
      expect(table).toBe("concerns");
      return {
        update: softUpdate,
        delete: hardDelete,
      };
    });

    const supabase = { from } as never;
    const { softDeleteConcern } = await import("@/lib/data/remote");
    await expect(softDeleteConcern(supabase, "c1")).resolves.toBeUndefined();
    expect(softUpdate).toHaveBeenCalled();
    expect(hardDelete).toHaveBeenCalled();
  });
});
