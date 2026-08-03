import { describe, expect, it } from "vitest";
import {
  getAdjacentMainTab,
  getMainTabIndex,
  normalizeAppPathname,
} from "@/lib/navigation/main-tabs";

describe("main-tabs navigation", () => {
  it("normalizes trailing slash", () => {
    expect(normalizeAppPathname("/home/")).toBe("/home");
    expect(normalizeAppPathname("/")).toBe("/");
  });

  it("resolves tab index from pathname", () => {
    expect(getMainTabIndex("/calendar/")).toBe(1);
    expect(getMainTabIndex("/records")).toBe(-1);
  });

  it("moves to adjacent tabs in bottom-nav order", () => {
    expect(getAdjacentMainTab("/home", "next")).toBe("/calendar");
    expect(getAdjacentMainTab("/calendar/", "next")).toBe("/charts");
    expect(getAdjacentMainTab("/charts", "next")).toBe("/settings");
    expect(getAdjacentMainTab("/settings", "next")).toBeNull();

    expect(getAdjacentMainTab("/settings", "prev")).toBe("/charts");
    expect(getAdjacentMainTab("/charts", "prev")).toBe("/calendar");
    expect(getAdjacentMainTab("/calendar", "prev")).toBe("/home");
    expect(getAdjacentMainTab("/home", "prev")).toBeNull();
  });

  it("ignores non-main routes", () => {
    expect(getAdjacentMainTab("/records", "next")).toBeNull();
    expect(getAdjacentMainTab("/growth", "prev")).toBeNull();
  });
});
