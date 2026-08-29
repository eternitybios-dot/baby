import { afterEach, describe, expect, it, vi } from "vitest";
import { copyToClipboard } from "@/lib/clipboard";

describe("copyToClipboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("空文字はコピーしない", async () => {
    expect(await copyToClipboard("   ")).toBe(false);
  });

  it("Clipboard API で前後空白を除いてコピーする", async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    expect(await copyToClipboard("  https://example.supabase.co  ")).toBe(true);
    expect(writeText).toHaveBeenCalledWith("https://example.supabase.co");
  });

  it("Clipboard API が失敗したら textarea 経由でコピーする", async () => {
    const writeText = vi.fn(async () => {
      throw new Error("denied");
    });
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const field = {
      value: "",
      setAttribute: vi.fn(),
      style: {} as CSSStyleDeclaration,
      focus: vi.fn(),
      select: vi.fn(),
      setSelectionRange: vi.fn(),
    };
    const body = {
      appendChild: vi.fn(),
      removeChild: vi.fn(),
    };
    vi.stubGlobal("document", {
      createElement: vi.fn(() => field),
      body,
      execCommand: vi.fn(() => true),
    });

    expect(await copyToClipboard("eyJanon")).toBe(true);
    expect(field.value).toBe("eyJanon");
    expect(field.select).toHaveBeenCalled();
    expect(document.execCommand).toHaveBeenCalledWith("copy");
    expect(body.removeChild).toHaveBeenCalledWith(field);
  });
});
