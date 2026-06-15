import NextAuth, { Account } from "next-auth";
import { JWT } from "next-auth/jwt";
import DiscordProvider from "next-auth/providers/discord";
import { createClient } from "@supabase/supabase-js";

function makeSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const authOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify guilds guilds.members.read" } },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }: { token: JWT; account?: Account | null; profile?: any }) {
      // On initial sign-in, store access token and Discord ID
      if (account && profile?.id) {
        token.accessToken = account.access_token;
        token.discordId = profile.id;

        // Upsert the user record so it always exists
        const supabase = makeSupabase();
        await supabase.from("users").upsert({
          discord_id: profile.id,
          username: profile.username ?? profile.global_name ?? "",
          avatar: profile.avatar ?? null,
        }, { onConflict: "discord_id", ignoreDuplicates: false });
      }

      // ALWAYS re-read is_superadmin so DB changes take effect immediately
      if (token.discordId) {
        const supabase = makeSupabase();
        const { data: dbUser } = await supabase
          .from("users")
          .select("is_superadmin")
          .eq("discord_id", token.discordId as string)
          .maybeSingle();
        token.isSuperadmin = dbUser?.is_superadmin ?? false;
      }

      return token;
    },

    async session({ session, token }: { session: any; token: JWT }) {
      session.accessToken = token.accessToken;
      if (session.user) {
        session.user.discordId = token.discordId;
        session.user.isSuperadmin = token.isSuperadmin;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
