import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { supabaseServer } from "@/lib/supabaseServer";
import CiudadanosClient from "./CiudadanosClient";

export default async function AdminCiudadanosPage({ params }: { params: Promise<{ guild_id: string }> }) {
  const { guild_id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/");

  const { data: isAdmin } = await supabaseServer
    .from("server_admins")
    .select("discord_id")
    .eq("discord_id", session.user.discordId)
    .eq("guild_id", guild_id)
    .maybeSingle();

  if (!isAdmin && !session.user.isSuperadmin) {
    return redirect(`/servidor/${guild_id}`);
  }

  return <CiudadanosClient />;
}
