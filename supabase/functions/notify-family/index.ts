/**
 * 家族メンバーへ Web Push を送る Edge Function
 *
 * Supabase Dashboard → Edge Functions でデプロイし、Secrets を設定:
 * - VAPID_PUBLIC_KEY
 * - VAPID_PRIVATE_KEY
 * - VAPID_SUBJECT (例: mailto:you@example.com)
 *
 * 秘密鍵をソースに書かないこと。
 */
// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function isGoneStatus(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status =
    "statusCode" in error
      ? Number(error.statusCode)
      : "status" in error
        ? Number(error.status)
        : NaN;
  return status === 404 || status === 410;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
    const vapidSubject =
      Deno.env.get("VAPID_SUBJECT") ?? "mailto:sukusuku@localhost";
    if (!vapidPublic || !vapidPrivate) {
      return new Response(JSON.stringify({ error: "VAPID keys not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const familyId = String(body.familyId ?? "");
    const title = String(body.title ?? "すくすくログ");
    const text = String(body.body ?? "新しい記録があります");
    const url = String(body.url ?? "/home/");
    const excludeUserId = String(body.excludeUserId ?? user.id);

    if (!familyId) {
      return new Response(JSON.stringify({ error: "familyId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: membership } = await admin
      .from("family_members")
      .select("id")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .is("left_at", null)
      .maybeSingle();

    if (!membership) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: subs, error: subsError } = await admin
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth, user_id")
      .eq("family_id", familyId)
      .neq("user_id", excludeUserId);

    if (subsError) throw subsError;

    const payload = JSON.stringify({
      title,
      body: text,
      url,
      tag: `sukusuku-${Date.now()}`,
    });

    const goneEndpoints: string[] = [];
    const results = await Promise.allSettled(
      (subs ?? []).map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload,
          );
        } catch (error) {
          if (isGoneStatus(error)) {
            goneEndpoints.push(sub.endpoint);
          }
          throw error;
        }
      }),
    );

    if (goneEndpoints.length > 0) {
      await admin
        .from("push_subscriptions")
        .delete()
        .in("endpoint", goneEndpoints);
    }

    const sent = results.filter((r) => r.status === "fulfilled").length;
    return new Response(
      JSON.stringify({
        ok: true,
        sent,
        total: subs?.length ?? 0,
        pruned: goneEndpoints.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
