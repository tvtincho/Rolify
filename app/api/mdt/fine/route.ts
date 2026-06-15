import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/lib/supabaseServer";
import { getUserGuildRoles } from "@/lib/getDiscordRoles";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { guild_id, citizen_rut, tipo, motivo, articulos, monto } = await req.json();
  if (!guild_id || !citizen_rut || !tipo || !motivo) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const discordId = session.user.discordId as string;

  // Validate that the user has permission (police role, admin, or superadmin)
  if (!session.user.isSuperadmin) {
    const { data: isAdmin } = await supabaseServer
      .from("server_admins").select("discord_id")
      .eq("discord_id", discordId).eq("guild_id", guild_id).maybeSingle();

    if (!isAdmin) {
      const { data: server } = await supabaseServer
        .from("servers").select("police_role_ids")
        .eq("guild_id", guild_id).maybeSingle();

      const userRoles = await getUserGuildRoles(session.accessToken, guild_id);
      const isPolice = server?.police_role_ids?.some((r: string) => userRoles.includes(r)) || false;

      if (!isPolice) {
        return NextResponse.json({ error: "Sin autorización policial" }, { status: 403 });
      }
    }
  }

  // Insert the fine
  const { error } = await supabaseServer.from("fines").insert({
    guild_id,
    citizen_rut,
    tipo,
    motivo: motivo.trim(),
    articulos: articulos?.trim() || null,
    monto: parseInt(monto) || 0,
    oficial_discord_id: discordId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Auto-deduct balance for multas
  let newBalance: number | null = null;
  const amount = parseInt(monto) || 0;

  if (tipo === "multa" && amount > 0) {
    const { data: citizen } = await supabaseServer
      .from("citizens").select("discord_id")
      .eq("guild_id", guild_id).eq("rut", citizen_rut).maybeSingle();

    if (citizen?.discord_id) {
      const { data: balData } = await supabaseServer
        .from("server_balances").select("balance")
        .eq("guild_id", guild_id).eq("discord_id", citizen.discord_id).maybeSingle();

      const current = balData?.balance ?? 0;
      newBalance = Math.max(0, current - amount);

      await supabaseServer.from("server_balances").upsert(
        { guild_id, discord_id: citizen.discord_id, balance: newBalance },
        { onConflict: "guild_id,discord_id" }
      );
    }
  }

  return NextResponse.json({ success: true, newBalance });
}
