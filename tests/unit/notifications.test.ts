import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/push/vapid-public", () => ({
  getVapidPublicKey: () => "test-public-key",
  hasVapidPublicKey: () => true,
  VAPID_PUBLIC_KEY: "test-public-key",
}));

describe("通知購読保存失敗時の結果", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  it("Push 購読保存に失敗したら ok:false（完全成功扱いにしない）", async () => {
    const NotificationMock = {
      permission: "granted" as NotificationPermission,
      requestPermission: vi.fn(async () => "granted" as NotificationPermission),
    };
    const registration = {
      update: vi.fn(),
      pushManager: {
        getSubscription: vi.fn(async () => null),
        subscribe: vi.fn(async () => ({
          toJSON: () => ({
            endpoint: "https://example.com/push",
            keys: { p256dh: "p", auth: "a" },
          }),
          unsubscribe: vi.fn(),
        })),
      },
      active: null,
      waiting: null,
      installing: null,
      showNotification: vi.fn(),
    };
    const navigatorMock = {
      serviceWorker: {
        register: vi.fn(async () => registration),
        ready: Promise.resolve(registration),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
      userAgent: "vitest",
    };
    const localStorageMock = {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] ?? null;
      },
      setItem(key: string, value: string) {
        this.store[key] = value;
      },
    };
    const windowMock = {
      localStorage: localStorageMock,
      location: { pathname: "/baby/home/", assign: vi.fn() },
      focus: vi.fn(),
      setTimeout: globalThis.setTimeout.bind(globalThis),
      Notification: NotificationMock,
      PushManager: function PushManager() {},
      navigator: navigatorMock,
    };

    vi.stubGlobal("window", windowMock);
    vi.stubGlobal("navigator", navigatorMock);
    vi.stubGlobal("Notification", NotificationMock);
    vi.stubGlobal("PushManager", windowMock.PushManager);
    vi.stubGlobal("localStorage", localStorageMock);

    const { enableNotifications } = await import("@/lib/notifications");

    const upsert = vi.fn(async () => ({
      error: { message: "rls denied" },
    }));
    const supabase = {
      from: () => ({ upsert }),
    };

    const result = await enableNotifications({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
      familyId: "fam",
      userId: "user",
    });

    expect(result.permissionGranted).toBe(true);
    expect(result.pushRegistered).toBe(false);
    expect(result.ok).toBe(false);
    expect(result.detail).toMatch(/未完了|失敗|003_push/);
    expect(upsert).toHaveBeenCalled();
  });
});

describe("notifyFamilyPush の error 確認", () => {
  it("functions.invoke の error を握りつぶさず返す", async () => {
    vi.resetModules();
    const { notifyFamilyPush } = await import("@/lib/notifications");
    const supabase = {
      functions: {
        invoke: vi.fn(async () => ({
          data: null,
          error: { message: "Edge Function failed" },
        })),
      },
    };

    const result = await notifyFamilyPush(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase as any,
      {
        familyId: "fam",
        title: "t",
        body: "b",
        url: "/home/",
        excludeUserId: "u1",
      },
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Edge Function failed");
    }
  });
});
