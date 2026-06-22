import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/google"; // wait, credentials provider
import Credentials from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@commentscanner.ai" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Validation check for local testing
        if (
          credentials?.email === "admin@commentscanner.ai" &&
          credentials?.password === "password123"
        ) {
          return {
            id: "1",
            name: "Admin User",
            email: "admin@commentscanner.ai",
          };
        }
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET || "default_auth_secret_key_12345_comment_scanner",
  pages: {
    signIn: "/api/auth/signin", // uses next-auth default or customized signin page
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
