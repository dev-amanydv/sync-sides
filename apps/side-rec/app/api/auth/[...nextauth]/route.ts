import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma from "hello-prisma";
import { compare } from 'bcryptjs';
import GoogleProvider from "next-auth/providers/google";

// NOTE: Add NEXTAUTH_SECRET, NEXTAUTH_URL, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET to turbo.json dependencies for turbo/no-undeclared-env-vars compliance.

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      
      async authorize(credentials) {
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
      clientId: process.env.GOOGLE_CLIENT_ID ?? (() => { throw new Error("GOOGLE_CLIENT_ID is not defined") })(),
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? (() => { throw new Error("GOOGLE_CLIENT_SECRET is not defined") })(),
    })
  ],
  secret: process.env.NEXTAUTH_SECRET ?? (() => { throw new Error("NEXTAUTH_SECRET is not defined") })(),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: "/auth/login", 
  },
  callbacks: {
    async signIn({ user, account }) {
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
        const dbUser = await prisma.user.findUnique({
          where:{
            email: user.email?.toString()
          }
        })
        if (dbUser){
          token.user = {
            id: dbUser.id.toString(),
            name: dbUser.fullname,
            email: user.email,
          };
        }
        
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