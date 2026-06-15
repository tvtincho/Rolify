import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/lib/supabaseServer";

const COOLDOWN_HOURS = 24;

// GET — check if user can claim and when next claim is available
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId) {
    return NextResponse.json({ nextClaim: null });
  }

  const { searchParams } = new URL(req.url);
  const guild_id = searchParams.get("guild_id");
  if (!guild_id) return NextResponse.json({ nextClaim: null });

  const { data } = await supabaseServer
    .from("salary_claims")
    .select("last_claimed_at")
    .eq("guild_id", guild_id)
    .eq("discord_id", session.user.discordId as string)
    .maybeSingle();

  if (!data?.last_claimed_at) {
    return NextResponse.json({ nextClaim: null });
  }

  const next = new Date(new Date(data.last_claimed_at).getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
  return NextResponse.json({ nextClaim: next.toISOString() });
}

// POST — claim salary based on Discord roles
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.discordId || !session.accessToken) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { guild_id } = await req.json();
  if (!guild_id) return NextResponse.json({ error: "guild_id requerido" }, { status: 400 });

  const discordId = session.user.discordId as string;

  // Check cooldown
  const { data: claimData } = await supabaseServer
    .from("salary_claims")
    .select("last_claimed_at")
    .eq("guild_id", guild_id)
    .eq("discord_id", discordId)
    .maybeSingle();

  if (claimData?.last_claimed_at) {
    const msSince = Date.now() - new Date(claimData.last_claimed_at).getTime();
    if (msSince < COOLDOWN_HOURS * 60 * 60 * 1000) {
      const nextClaim = new Date(new Date(claimData.last_claimed_at).getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
      return NextResponse.json({ error: "Ya cobraste hoy", nextClaim: nextClaim.toISOString() }, { status: 429 });
    }
  }

  // Get user's Discord roles in guild
  const memberRes = await fetch(`https://discord.com/api/users/@me/guilds/${guild_id}/member`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });

  if (!memberRes.ok) {
    return NextResponse.json({ error: "No se pudo verificar membresía en el servidor" }, { status: 403 });
  }

  const member = await memberRes.json();
  const userRoleIds: string[] = member.roles || [];

  // Get salary configs for this guild
  const { data: salaries } = await supabaseServer
    .from("server_salaries")
    .select("role_id, amount, role_name")
    .eq("guild_id", guild_id);

  if (!salaries || salaries.length === 0) {
    return NextResponse.json({ error: "No hay sueldos configurados en este servidor" }, { status: 400 });
  }

  const matched = salaries.filter(s => userRoleIds.includes(s.role_id));
  const totalAmount = matched.reduce((sum, s) => sum + s.amount, 0);

  if (totalAmount === 0) {
    return NextResponse.json({ error: "No tienes roles con sueldo asignado" }, { status: 400 });
  }

  // Add to balance
  const { data: balData } = await supabaseServer
    .from("server_balances")
    .select("balance")
    .eq("guild_id", guild_id)
    .eq("discord_id", discordId)
    .maybeSingle();

  const newBalance = (balData?.balance ?? 0) + totalAmount;

  await supabaseServer.from("server_balances").upsert(
    { guild_id, discord_id: discordId, balance: newBalance },
    { onConflict: "guild_id,discord_id" }
  );

  // Record claim time
  await supabaseServer.from("salary_claims").upsert(
    { guild_id, discord_id: discordId, last_claimed_at: new Date().toISOString() },
    { onConflict: "guild_id,discord_id" }
  );

  return NextResponse.json({
    success: true,
    totalAmount,
    newBalance,
    matched: matched.map(s => ({ name: s.role_name, amount: s.amount })),
    nextClaim: new Date(Date.now() + COOLDOWN_HOURS * 60 * 60 * 1000).toISOString(),
  });
}
