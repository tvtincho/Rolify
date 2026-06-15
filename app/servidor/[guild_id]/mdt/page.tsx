import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/lib/supabaseServer";
import { getUserGuildRoles } from "@/lib/getDiscordRoles";
import MDTClient from "./MDTClient";

export default async function MDTPage({ params }: { params: Promise<{ guild_id: string }> }) {
  const { guild_id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/");

  const { data: server } = await supabaseServer
    .from("servers")
    .select("police_role_ids, guild_name, logo_url")
    .eq("guild_id", guild_id)
    .maybeSingle();

  if (!server) return redirect(`/servidor/${guild_id}`);

  const { data: isAdmin } = await supabaseServer
    .from("server_admins")
    .select("discord_id")
    .eq("discord_id", session.user.discordId)
    .eq("guild_id", guild_id)
    .maybeSingle();

  const userRoles = await getUserGuildRoles(session.accessToken, guild_id);
  const isPolice = server.police_role_ids?.some((r: string) => userRoles.includes(r)) || false;

  if (!isPolice && !isAdmin && !session.user.isSuperadmin) {
    return redirect(`/servidor/${guild_id}`);
  }

  return <MDTClient serverName={server.guild_name} serverLogo={server.logo_url || null} />;
}
