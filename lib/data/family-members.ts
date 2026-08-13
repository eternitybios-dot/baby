import type { FamilyRole, Profile } from "@/types/domain";

export type FamilyMember = Profile & { role: FamilyRole };

/** この端末以外のメンバー（作成者含む）は一覧から外せる */
export function canRemoveFamilyMember(
  memberId: string,
  currentUserId: string,
): boolean {
  return memberId !== currentUserId;
}

/**
 * 作成者を外したあとは、残った先頭メンバーを作成者にする。
 * サーバー側は操作した人を優先して昇格する。
 */
export function familyMembersAfterRemoval(
  members: FamilyMember[],
  removedId: string,
  successorId?: string,
): FamilyMember[] {
  const remaining = members.filter((member) => member.id !== removedId);
  const removed = members.find((member) => member.id === removedId);
  if (removed?.role !== "owner") return remaining;
  if (remaining.some((member) => member.role === "owner")) return remaining;

  const successor =
    remaining.find((member) => member.id === successorId) ?? remaining[0];
  if (!successor) return remaining;

  return remaining.map((member) =>
    member.id === successor.id ? { ...member, role: "owner" } : member,
  );
}
