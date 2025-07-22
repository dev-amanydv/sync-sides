import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { compare } from 'bcryptjs';
import GoogleProvider from "next-auth/providers/google";


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

        if (!email || !password) {
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.log("User not found:", email);
            return null;
          }

          const isValid = await compare(password, user.password);

          if (!isValid) {
            console.log("Invalid password for:", email);
            return null;
          }

          console.log("Login successful for:", email);
          return {
            id: user.id.toString(),
            name: user.fullname,
            email: user.email,
          };
        } catch (error) {
          console.error("Error in authorize function:", error);
          throw new Error("Server error during authorization");
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

                password: "not-a-real-password" 
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
        (session.user as any).id = (token.user as any).id;
      }
      return session;
    }
  },
  debug: true,
});

console.log("✅ AUTH HANDLER LOADED AND RUNNING");

export { handler as GET, handler as POST };
