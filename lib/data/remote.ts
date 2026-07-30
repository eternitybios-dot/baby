import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Baby,
  CareRecord,
  CareRecordDetail,
  CareRecordType,
  Concern,
  ConcernStatus,
  FamilyRole,
  FamilySettings,
  GrowthPoint,
  Habit,
  HabitStatus,
  Profile,
} from "@/types/domain";
import { createEmptyState, type AppState } from "@/lib/data/app-state";

type DbProfile = {
  id: string;
  display_name: string;
};

type DbFamily = {
  id: string;
  name: string;
  invite_code: string;
};

type DbMember = {
  family_id: string;
  user_id: string;
  role: FamilyRole;
  profiles: DbProfile | DbProfile[] | null;
};

type DbBaby = {
  id: string;
  family_id: string;
  name: string;
  nickname: string | null;
  birth_date: string;
  sex: Baby["sex"];
  birth_weight_g: number | null;
  birth_height_cm: number | null;
  memo: string | null;
};

type DbCare = {
  id: string;
  family_id: string;
  baby_id: string;
  user_id: string;
  record_type: CareRecordType;
  recorded_at: string;
  started_at: string | null;
  ended_at: string | null;
  note: string | null;
  detail_json: CareRecordDetail | Record<string, unknown>;
};

type DbGrowth = {
  id: string;
  measured_at: string;
  weight_g: number | null;
  height_cm: number | null;
  head_circumference_cm: number | null;
  note: string | null;
};

type DbConcern = {
  id: string;
  title: string;
  category: string;
  body: string;
  severity: number;
  action_taken: string | null;
  result: string | null;
  status: ConcernStatus;
  occurred_at: string;
  user_id: string;
};

type DbHabit = {
  id: string;
  name: string;
  category: string;
  body: string;
  likely_time_of_day: string;
  frequency: string;
  effective_response: string | null;
  last_confirmed_at: string | null;
  status: HabitStatus;
};

function asProfile(row: DbProfile | null | undefined): Profile {
  return {
    id: row?.id ?? "unknown",
    displayName: row?.display_name ?? "メンバー",
    avatarUrl: null,
  };
}

function unwrapProfile(
  profiles: DbProfile | DbProfile[] | null | undefined,
): DbProfile | null {
  if (!profiles) return null;
  return Array.isArray(profiles) ? (profiles[0] ?? null) : profiles;
}

function mapDetail(
  recordType: CareRecordType,
  detail: CareRecordDetail | Record<string, unknown>,
): CareRecordDetail {
  if (detail && typeof detail === "object" && "type" in detail) {
    return detail as CareRecordDetail;
  }
  return { type: "other", label: recordType };
}

function mapBaby(row: DbBaby): Baby {
  return {
    id: row.id,
    familyId: row.family_id,
    name: row.name,
    nickname: row.nickname,
    birthDate: row.birth_date,
    sex: row.sex,
    avatarUrl: null,
    birthWeightG: row.birth_weight_g,
    birthHeightCm: row.birth_height_cm == null ? null : Number(row.birth_height_cm),
    memo: row.memo,
  };
}

export async function ensureAnonymousSession(
  supabase: SupabaseClient,
): Promise<{ userId: string }> {
  const { data: existing, error: existingError } = await supabase.auth.getSession();
  if (existingError) throw existingError;
  if (existing.session?.user?.id) {
    return { userId: existing.session.user.id };
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  if (!data.user?.id) throw new Error("匿名サインインに失敗しました");
  return { userId: data.user.id };
}

export async function fetchFamilyBundle(
  supabase: SupabaseClient,
  userId: string,
): Promise<AppState | null> {
  const { data: membership, error: membershipError } = await supabase
    .from("family_members")
    .select("family_id, role")
    .eq("user_id", userId)
    .is("left_at", null)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (membershipError) throw membershipError;
  if (!membership?.family_id) return null;

  const familyId = membership.family_id as string;

  const [
    familyRes,
    membersRes,
    babyRes,
    recordsRes,
    growthRes,
    concernsRes,
    habitsRes,
    meRes,
  ] = await Promise.all([
    supabase.from("families").select("id, name, invite_code").eq("id", familyId).single(),
    supabase
      .from("family_members")
      .select("family_id, user_id, role, profiles(id, display_name)")
      .eq("family_id", familyId)
      .is("left_at", null),
    supabase
      .from("babies")
      .select(
        "id, family_id, name, nickname, birth_date, sex, birth_weight_g, birth_height_cm, memo",
      )
      .eq("family_id", familyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("care_records")
      .select(
        "id, family_id, baby_id, user_id, record_type, recorded_at, started_at, ended_at, note, detail_json",
      )
      .eq("family_id", familyId)
      .is("deleted_at", null)
      .order("recorded_at", { ascending: false })
      .limit(500),
    supabase
      .from("growth_records")
      .select(
        "id, measured_at, weight_g, height_cm, head_circumference_cm, note",
      )
      .eq("family_id", familyId)
      .is("deleted_at", null)
      .order("measured_at", { ascending: true }),
    supabase
      .from("concerns")
      .select(
        "id, title, category, body, severity, action_taken, result, status, occurred_at, user_id",
      )
      .eq("family_id", familyId)
      .is("deleted_at", null)
      .order("occurred_at", { ascending: false }),
    supabase
      .from("habits")
      .select(
        "id, name, category, body, likely_time_of_day, frequency, effective_response, last_confirmed_at, status",
      )
      .eq("family_id", familyId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, display_name").eq("id", userId).maybeSingle(),
  ]);

  if (familyRes.error) throw familyRes.error;
  if (membersRes.error) throw membersRes.error;
  if (babyRes.error) throw babyRes.error;
  if (recordsRes.error) throw recordsRes.error;
  if (growthRes.error) throw growthRes.error;
  if (concernsRes.error) throw concernsRes.error;
  if (habitsRes.error) throw habitsRes.error;
  if (meRes.error) throw meRes.error;

  const family = familyRes.data as DbFamily;
  const members = (membersRes.data ?? []) as DbMember[];
  const babyRow = babyRes.data as DbBaby | null;

  if (!babyRow) {
    const empty = createEmptyState();
    empty.currentUserId = userId;
    empty.family = {
      familyId: family.id,
      familyName: family.name,
      inviteCode: family.invite_code,
      members: members.map((m) => ({
        ...asProfile(unwrapProfile(m.profiles)),
        id: m.user_id,
        role: m.role,
      })),
    };
    return empty;
  }

  const profileById = new Map<string, Profile>();
  for (const m of members) {
    const p = asProfile(unwrapProfile(m.profiles));
    profileById.set(m.user_id, { ...p, id: m.user_id });
  }
  if (meRes.data) {
    profileById.set(userId, asProfile(meRes.data as DbProfile));
  }

  const familySettings: FamilySettings = {
    familyId: family.id,
    familyName: family.name,
    inviteCode: family.invite_code,
    members: members.map((m) => ({
      ...(profileById.get(m.user_id) ?? {
        id: m.user_id,
        displayName: "メンバー",
        avatarUrl: null,
      }),
      role: m.role,
    })),
  };

  const records: CareRecord[] = ((recordsRes.data ?? []) as DbCare[]).map((row) => {
    const recorder = profileById.get(row.user_id) ?? {
      id: row.user_id,
      displayName: "メンバー",
      avatarUrl: null,
    };
    return {
      id: row.id,
      familyId: row.family_id,
      babyId: row.baby_id,
      userId: row.user_id,
      recordType: row.record_type,
      recordedAt: row.recorded_at,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      note: row.note,
      detail: mapDetail(row.record_type, row.detail_json),
      recorder,
    };
  });

  const growth: GrowthPoint[] = ((growthRes.data ?? []) as DbGrowth[]).map((row) => ({
    id: row.id,
    measuredAt: row.measured_at,
    weightG: row.weight_g,
    heightCm: row.height_cm == null ? null : Number(row.height_cm),
    headCircumferenceCm:
      row.head_circumference_cm == null ? null : Number(row.head_circumference_cm),
    note: row.note,
  }));

  const concerns: Concern[] = ((concernsRes.data ?? []) as DbConcern[]).map((row) => ({
    id: row.id,
    title: row.title,
    category: row.category,
    body: row.body,
    severity: Math.min(5, Math.max(1, row.severity)) as Concern["severity"],
    actionTaken: row.action_taken,
    result: row.result,
    status: row.status,
    occurredAt: row.occurred_at,
    recorder: profileById.get(row.user_id) ?? {
      id: row.user_id,
      displayName: "メンバー",
      avatarUrl: null,
    },
  }));

  const habits: Habit[] = ((habitsRes.data ?? []) as DbHabit[]).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    body: row.body,
    likelyTimeOfDay: row.likely_time_of_day,
    frequency: row.frequency,
    effectiveResponse: row.effective_response,
    lastConfirmedAt: row.last_confirmed_at,
    status: row.status,
  }));

  return {
    version: 2,
    baby: mapBaby(babyRow),
    family: familySettings,
    currentUserId: userId,
    records,
    growth,
    concerns,
    habits,
  };
}

export async function createFamilyWithBaby(
  supabase: SupabaseClient,
  input: {
    familyName: string;
    displayName: string;
    babyName: string;
    birthDate: string;
  },
): Promise<void> {
  const { error } = await supabase.rpc("create_family_with_baby", {
    p_family_name: input.familyName,
    p_display_name: input.displayName,
    p_baby_name: input.babyName,
    p_birth_date: input.birthDate,
  });
  if (error) throw error;
}

export async function joinFamilyWithCode(
  supabase: SupabaseClient,
  input: { inviteCode: string; displayName: string },
): Promise<void> {
  const { error } = await supabase.rpc("join_family_with_code", {
    p_invite_code: input.inviteCode,
    p_display_name: input.displayName,
  });
  if (error) throw error;
}

export async function updateProfileName(
  supabase: SupabaseClient,
  userId: string,
  displayName: string,
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: displayName, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

export async function updateBabyRemote(
  supabase: SupabaseClient,
  babyId: string,
  patch: Partial<Baby>,
): Promise<void> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.nickname !== undefined) payload.nickname = patch.nickname;
  if (patch.birthDate !== undefined) payload.birth_date = patch.birthDate;
  if (patch.sex !== undefined) payload.sex = patch.sex;
  if (patch.birthWeightG !== undefined) payload.birth_weight_g = patch.birthWeightG;
  if (patch.birthHeightCm !== undefined) payload.birth_height_cm = patch.birthHeightCm;
  if (patch.memo !== undefined) payload.memo = patch.memo;

  const { error } = await supabase.from("babies").update(payload).eq("id", babyId);
  if (error) throw error;
}

export async function insertCareRecordRemote(
  supabase: SupabaseClient,
  record: CareRecord,
): Promise<void> {
  const { error } = await supabase.from("care_records").insert({
    id: record.id,
    family_id: record.familyId,
    baby_id: record.babyId,
    user_id: record.userId,
    record_type: record.recordType,
    recorded_at: record.recordedAt,
    started_at: record.startedAt,
    ended_at: record.endedAt,
    note: record.note,
    detail_json: record.detail,
  });
  if (error) throw error;
}

export async function updateCareRecordRemote(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<CareRecord>,
): Promise<void> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.recordType !== undefined) payload.record_type = patch.recordType;
  if (patch.recordedAt !== undefined) payload.recorded_at = patch.recordedAt;
  if (patch.startedAt !== undefined) payload.started_at = patch.startedAt;
  if (patch.endedAt !== undefined) payload.ended_at = patch.endedAt;
  if (patch.note !== undefined) payload.note = patch.note;
  if (patch.detail !== undefined) payload.detail_json = patch.detail;

  const { error } = await supabase.from("care_records").update(payload).eq("id", id);
  if (error) throw error;
}

export async function softDeleteCareRecord(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("care_records")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function insertGrowthRemote(
  supabase: SupabaseClient,
  input: {
    id: string;
    familyId: string;
    babyId: string;
    userId: string;
    measuredAt: string;
    weightG: number | null;
    heightCm: number | null;
    headCircumferenceCm: number | null;
    note: string | null;
  },
): Promise<void> {
  const { error } = await supabase.from("growth_records").insert({
    id: input.id,
    family_id: input.familyId,
    baby_id: input.babyId,
    user_id: input.userId,
    measured_at: input.measuredAt,
    weight_g: input.weightG,
    height_cm: input.heightCm,
    head_circumference_cm: input.headCircumferenceCm,
    note: input.note,
  });
  if (error) throw error;
}

export async function softDeleteGrowth(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("growth_records")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function insertConcernRemote(
  supabase: SupabaseClient,
  input: {
    id: string;
    familyId: string;
    babyId: string;
    userId: string;
    title: string;
    category: string;
    body: string;
    severity: number;
    actionTaken: string | null;
    result: string | null;
    status: ConcernStatus;
    occurredAt: string;
  },
): Promise<void> {
  const { error } = await supabase.from("concerns").insert({
    id: input.id,
    family_id: input.familyId,
    baby_id: input.babyId,
    user_id: input.userId,
    title: input.title,
    category: input.category,
    body: input.body,
    severity: input.severity,
    action_taken: input.actionTaken,
    result: input.result,
    status: input.status,
    occurred_at: input.occurredAt,
  });
  if (error) throw error;
}

export async function updateConcernRemote(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Concern>,
): Promise<void> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.category !== undefined) payload.category = patch.category;
  if (patch.body !== undefined) payload.body = patch.body;
  if (patch.severity !== undefined) payload.severity = patch.severity;
  if (patch.actionTaken !== undefined) payload.action_taken = patch.actionTaken;
  if (patch.result !== undefined) payload.result = patch.result;
  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.occurredAt !== undefined) payload.occurred_at = patch.occurredAt;

  const { error } = await supabase.from("concerns").update(payload).eq("id", id);
  if (error) throw error;
}

export async function softDeleteConcern(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("concerns")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function insertHabitRemote(
  supabase: SupabaseClient,
  input: {
    id: string;
    familyId: string;
    babyId: string;
    userId: string;
    name: string;
    category: string;
    body: string;
    likelyTimeOfDay: string;
    frequency: string;
    effectiveResponse: string | null;
    lastConfirmedAt: string | null;
    status: HabitStatus;
  },
): Promise<void> {
  const { error } = await supabase.from("habits").insert({
    id: input.id,
    family_id: input.familyId,
    baby_id: input.babyId,
    user_id: input.userId,
    name: input.name,
    category: input.category,
    body: input.body,
    likely_time_of_day: input.likelyTimeOfDay,
    frequency: input.frequency,
    effective_response: input.effectiveResponse,
    last_confirmed_at: input.lastConfirmedAt,
    status: input.status,
  });
  if (error) throw error;
}

export async function updateHabitRemote(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<Habit>,
): Promise<void> {
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.name !== undefined) payload.name = patch.name;
  if (patch.category !== undefined) payload.category = patch.category;
  if (patch.body !== undefined) payload.body = patch.body;
  if (patch.likelyTimeOfDay !== undefined) {
    payload.likely_time_of_day = patch.likelyTimeOfDay;
  }
  if (patch.frequency !== undefined) payload.frequency = patch.frequency;
  if (patch.effectiveResponse !== undefined) {
    payload.effective_response = patch.effectiveResponse;
  }
  if (patch.lastConfirmedAt !== undefined) {
    payload.last_confirmed_at = patch.lastConfirmedAt;
  }
  if (patch.status !== undefined) payload.status = patch.status;

  const { error } = await supabase.from("habits").update(payload).eq("id", id);
  if (error) throw error;
}

export async function softDeleteHabit(
  supabase: SupabaseClient,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("habits")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export function subscribeFamilyRealtime(
  supabase: SupabaseClient,
  familyId: string,
  onChange: () => void,
): () => void {
  const channel = supabase
    .channel(`family-${familyId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "care_records", filter: `family_id=eq.${familyId}` },
      () => onChange(),
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "growth_records",
        filter: `family_id=eq.${familyId}`,
      },
      () => onChange(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "concerns", filter: `family_id=eq.${familyId}` },
      () => onChange(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "habits", filter: `family_id=eq.${familyId}` },
      () => onChange(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "babies", filter: `family_id=eq.${familyId}` },
      () => onChange(),
    )
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "family_members",
        filter: `family_id=eq.${familyId}`,
      },
      () => onChange(),
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}
