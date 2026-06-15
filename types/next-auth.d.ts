import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      discordId?: string;
      isSuperadmin?: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
  interface User {
    isSuperadmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    discordId?: string;
    isSuperadmin?: boolean;
  }
}