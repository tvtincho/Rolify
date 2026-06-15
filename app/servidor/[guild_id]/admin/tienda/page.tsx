import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";
import TiendaAdminClient from "./TiendaAdminClient";

export default async function TiendaAdminPage({ params }: { params: Promise<{ guild_id: string }> }) {
  const { guild_id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/");

  const { data: isAdmin } = await supabaseServer
    .from("server_admins").select("discord_id")
    .eq("discord_id", (session.user as any).discordId)
    .eq("guild_id", guild_id).maybeSingle();

  if (!isAdmin && !(session.user as any).isSuperadmin) return redirect(`/servidor/${guild_id}`);

  return <TiendaAdminClient guildId={guild_id} />;
}
