// Edge Function de gestão de usuários do GAMA Ops Hub.
// Roda com a service role key (nunca exposta ao browser) e só aceita chamadas
// de quem tem papel "comando" na tabela profiles.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const { data: callerAuth, error: callerAuthError } = await admin.auth.getUser(token);
  if (callerAuthError || !callerAuth.user) {
    return json({ success: false, error: "Não autenticado." }, 401);
  }

  const { data: callerProfile } = await admin
    .from("profiles")
    .select("papel, login_id")
    .eq("id", callerAuth.user.id)
    .single();

  if (callerProfile?.papel !== "comando") {
    return json({ success: false, error: "Acesso negado." }, 403);
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json({ success: false, error: "Corpo da requisição inválido." }, 400);
  }

  switch (body.action) {
    case "list": {
      const { data, error } = await admin.from("profiles").select("login_id, nome, papel");
      if (error) return json({ success: false, error: error.message });
      return json({
        success: true,
        users: data.map((p) => ({ id: p.login_id, nome: p.nome, papel: p.papel })),
      });
    }

    case "create": {
      const newId = String(body.newId ?? "").trim();
      const newSenha = String(body.newSenha ?? "").trim();
      const newNome = String(body.newNome ?? "").trim();
      const newPapel = String(body.newPapel ?? "").trim();
      if (!newId || !newSenha || !newNome || !newPapel) {
        return json({ success: false, error: "Dados incompletos." });
      }

      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: `${newId}@gama.local`,
        password: newSenha,
        email_confirm: true,
        user_metadata: { nome: newNome, papel: newPapel, login_id: newId },
      });
      if (createError) return json({ success: false, error: createError.message });

      // O trigger on_auth_user_created já cria o profile — upsert aqui garante
      // consistência mesmo se o trigger falhar por algum motivo.
      await admin
        .from("profiles")
        .upsert({ id: created.user!.id, nome: newNome, papel: newPapel, login_id: newId });

      return json({ success: true });
    }

    case "update": {
      const targetId = String(body.targetId ?? "").trim();
      const newNome = String(body.newNome ?? "").trim();
      const newPapel = String(body.newPapel ?? "").trim();
      const newSenha = String(body.newSenha ?? "").trim();
      if (!targetId || !newNome || !newPapel) {
        return json({ success: false, error: "Dados incompletos." });
      }

      const { data: target } = await admin
        .from("profiles")
        .select("id")
        .eq("login_id", targetId)
        .single();
      if (!target) return json({ success: false, error: "Usuário não encontrado." });

      const updatePayload: Record<string, unknown> = {
        user_metadata: { nome: newNome, papel: newPapel, login_id: targetId },
      };
      if (newSenha) updatePayload.password = newSenha;

      const { error: updateError } = await admin.auth.admin.updateUserById(target.id, updatePayload);
      if (updateError) return json({ success: false, error: updateError.message });

      await admin.from("profiles").update({ nome: newNome, papel: newPapel }).eq("id", target.id);
      return json({ success: true });
    }

    case "delete": {
      const targetId = String(body.targetId ?? "").trim();
      if (!targetId) return json({ success: false, error: "ID não informado." });
      if (targetId === callerProfile.login_id) {
        return json({ success: false, error: "Não é possível excluir o próprio usuário." });
      }

      const { data: target } = await admin
        .from("profiles")
        .select("id")
        .eq("login_id", targetId)
        .single();
      if (!target) return json({ success: false, error: "Usuário não encontrado." });

      const { error: deleteError } = await admin.auth.admin.deleteUser(target.id);
      if (deleteError) return json({ success: false, error: deleteError.message });
      return json({ success: true });
    }

    default:
      return json({ success: false, error: "Ação inválida." }, 400);
  }
});
