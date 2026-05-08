import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { goals, interests, industry } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleRows } = await admin.from("user_roles").select("user_id").eq("role", "alumni");
    const ids = (roleRows ?? []).map((r: any) => r.user_id);
    if (ids.length === 0) return new Response(JSON.stringify({ matches: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: alumni } = await admin.from("profiles").select("id, full_name, company, job_title, bio, graduation_year").in("id", ids);

    const list = (alumni ?? []).map((a: any) => ({
      id: a.id, name: a.full_name, role: a.job_title, company: a.company, year: a.graduation_year, bio: a.bio,
    }));

    const prompt = `A student is looking for mentorship.
Goals: ${goals || "(not specified)"}
Interests: ${interests || "(not specified)"}
Preferred industry: ${industry || "(any)"}

Here are the available alumni (JSON array):
${JSON.stringify(list, null, 2)}

Pick the TOP 5 best-fit alumni (or fewer if fewer exist). Reply ONLY with JSON of shape:
{"matches":[{"id":"<alumni_id>","reason":"<one short sentence why this alum fits>"}]}
Order by best match first.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a professional mentorship matchmaker. Reply only with valid JSON." },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: t }), { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(content); } catch { parsed = { matches: [] }; }
    const matches = (parsed.matches ?? []).map((m: any) => {
      const a = list.find((x: any) => x.id === m.id);
      return a ? { ...a, reason: m.reason } : null;
    }).filter(Boolean);

    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
