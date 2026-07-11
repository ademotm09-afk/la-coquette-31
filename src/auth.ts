import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

const previewEmail = "admin@lacoquette.dz";
const previewPasswordHash = "$2b$10$OJJBk2IJxxCGPjzCluq8Zem/4lFkTBBIE9H7KPzRchnBhyzVpj2ae";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET || "la-coquette-preview-secret-change-in-production-2026",
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email || "").trim().toLowerCase();
        const password = String(credentials?.password || "");
        const adminEmail = (process.env.ADMIN_EMAIL || previewEmail).toLowerCase();
        const configuredHash = process.env.ADMIN_PASSWORD_HASH;
        const configuredPassword = process.env.ADMIN_PASSWORD;

        if (!email || !password || email !== adminEmail) return null;
        const valid = configuredHash
          ? await bcrypt.compare(password, configuredHash)
          : configuredPassword
            ? password === configuredPassword
            : await bcrypt.compare(password, previewPasswordHash);

        if (!valid) return null;
        return { id: "la-coquette-admin", email: adminEmail, name: "La Coquette Admin" };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = "admin";
      return token;
    },
    session({ session, token }) {
      if (session.user) session.user.name = token.name || "La Coquette Admin";
      return session;
    },
  },
});
