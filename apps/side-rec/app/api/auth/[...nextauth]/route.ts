import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from "../../../../lib/prisma";
import { compare } from 'bcryptjs';
import GoogleProvider from "next-auth/providers/google";

console.log("NextAuth configuration loaded");
console.log("NEXTAUTH_SECRET:", process.env.NEXTAUTH_SECRET ? "Set" : "Not set");
console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      
      async authorize(credentials, req) {
        console.log("=== AUTHORIZE FUNCTION CALLED ===");
        const email = credentials?.email;
        const password = credentials?.password;
        console.log("🔥 authorize called with", credentials);
        console.log("Attempting login with:", email);

        if (!email || !password) {
          console.log("Missing email or password");
          throw new Error("Missing credentials");
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.log("User not found:", email);
            throw new Error("User not found");
          }

          const isValid = await compare(password, user.password);

          if (!isValid) {
            console.log("Invalid password for:", email);
            throw new Error("Invalid password");
          }

          console.log("Login successful for:", email);

          return {
            id: user.id.toString(),
            name: user.fullname,
            email: user.email,
          };
        } catch (error) {
          console.error("Error in authorize function:", error);
          throw error;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: "/auth/login", 
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("🔁 signIn callback called");

      if (account?.provider === "google") {
        try {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email! },
          });

          if (!existingUser) {
            await prisma.user.create({
              data: {
                email: user.email!,
                fullname: user.name ?? "No Name",
                password: "GooglePassword"
              },
            });
          }

          return true;
        } catch (error) {
          console.error("❌ Error saving Google user:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.user = {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token?.user) {
        session.user.id = token.user.id; // now it's a string
      }
      return session;
    }
  },
  debug: true,
});
console.log("✅ AUTH HANDLER LOADED AND RUNNING");

export { handler as GET, handler as POST };