import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { pool } from "@/lib/db";

export type AppRole = "admin" | "federation";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      name: string;
      federationId?: number;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: AppRole;
    federationId?: number;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      authorize: async (credentials) => {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!username || !password) return null;

        // Auto-detect: check admins first, then federations.
        const adminResult = await pool.query(
          "SELECT id, name, username, password_hash FROM admins WHERE username = $1",
          [username]
        );
        if (adminResult.rows.length > 0) {
          const admin = adminResult.rows[0];
          const valid = await bcrypt.compare(password, admin.password_hash);
          if (!valid) return null;
          return {
            id: String(admin.id),
            name: admin.name,
            role: "admin" as AppRole,
          };
        }

        const fedResult = await pool.query(
          "SELECT id, name, username, password_hash, is_active FROM federations WHERE username = $1",
          [username]
        );
        if (fedResult.rows.length > 0) {
          const federation = fedResult.rows[0];
          if (!federation.is_active) return null;
          const valid = await bcrypt.compare(password, federation.password_hash);
          if (!valid) return null;
          return {
            id: String(federation.id),
            name: federation.name,
            role: "federation" as AppRole,
            federationId: federation.id,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = (user as { role: AppRole }).role;
        if ((user as { federationId?: number }).federationId) {
          token.federationId = (user as { federationId?: number }).federationId;
        }
      }
      return token;
    },
    session: async ({ session, token }) => {
      session.user.id = token.sub as string;
      session.user.role = token.role;
      if (token.federationId) {
        session.user.federationId = token.federationId;
      }
      return session;
    },
  },
});
