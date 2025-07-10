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
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!
      })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: "/auth/login", 
    // error: "/auth/login", 
  },
  debug: true,
});
console.log("✅ AUTH HANDLER LOADED AND RUNNING");

export { handler as GET, handler as POST };