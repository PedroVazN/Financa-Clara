import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: UserRole;
      clientProfileId?: string | null;
      managerProfileId?: string | null;
    };
  }

  interface User {
    role: UserRole;
    clientProfileId?: string | null;
    managerProfileId?: string | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    clientProfileId?: string | null;
    managerProfileId?: string | null;
  }
}

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.clientProfileId = user.clientProfileId;
        token.managerProfileId = user.managerProfileId;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.clientProfileId = token.clientProfileId;
      session.user.managerProfileId = token.managerProfileId;
      return session;
    },
  },
} satisfies NextAuthConfig;
