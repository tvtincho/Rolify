import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import TiendaClient from "./TiendaClient";

export default async function TiendaPage({ params }: { params: Promise<{ guild_id: string }> }) {
  const { guild_id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/");
  return <TiendaClient guildId={guild_id} discordId={(session.user as any).discordId} />;
}
