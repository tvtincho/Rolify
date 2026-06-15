export async function getUserGuildRoles(accessToken: string | undefined, guildId: string): Promise<string[]> {
  if (!accessToken) return [];
  const response = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!response.ok) return [];
  const data = await response.json();
  return data.roles || [];
}