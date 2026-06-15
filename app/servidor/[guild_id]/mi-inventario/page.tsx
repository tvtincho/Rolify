import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import InventarioClient from "./InventarioClient";

export default async function InventarioPage({ params }: { params: Promise<{ guild_id: string }> }) {
  const { guild_id } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/");
  return <InventarioClient guildId={guild_id} discordId={(session.user as any).discordId} />;
}
