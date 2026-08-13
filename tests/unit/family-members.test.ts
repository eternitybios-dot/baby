import { describe, expect, it } from "vitest";
import {
  canRemoveFamilyMember,
  familyMembersAfterRemoval,
} from "@/lib/data/family-members";
import type { FamilyMember } from "@/lib/data/family-members";

const owner: FamilyMember = {
  id: "owner-1",
  displayName: "パパ",
  avatarUrl: null,
  role: "owner",
};
const me: FamilyMember = {
  id: "me",
  displayName: "パパ",
  avatarUrl: null,
  role: "member",
};
const partner: FamilyMember = {
  id: "partner",
  displayName: "ママ",
  avatarUrl: null,
  role: "member",
};

describe("家族メンバーの削除", () => {
  it("この端末以外なら作成者も外せる", () => {
    expect(canRemoveFamilyMember(owner.id, me.id)).toBe(true);
    expect(canRemoveFamilyMember(me.id, me.id)).toBe(false);
  });

  it("作成者を外すと操作した人が作成者になる", () => {
    const next = familyMembersAfterRemoval([owner, me, partner], owner.id, me.id);
    expect(next.map((m) => m.id)).toEqual(["me", "partner"]);
    expect(next.find((m) => m.id === "me")?.role).toBe("owner");
    expect(next.find((m) => m.id === "partner")?.role).toBe("member");
  });

  it("メンバーを外しても作成者はそのまま", () => {
    const next = familyMembersAfterRemoval([owner, me, partner], partner.id, me.id);
    expect(next.map((m) => m.id)).toEqual(["owner-1", "me"]);
    expect(next.find((m) => m.id === "owner-1")?.role).toBe("owner");
  });
});
