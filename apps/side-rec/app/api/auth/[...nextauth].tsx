import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials';
import prisma  from "hello-prisma";
import { compare } from 'bcryptjs';

const handler = NextAuth({
    providers:[
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email' , type: 'email' },
                password: { label: 'Password', type: 'password'}
            },
            async authorize (credentials, req) {
                const email = credentials?.email;
                const password = credentials?.password;

                console.log("Attempting login with:", email);

                if (!email || !password) {
                    console.log("Missing email or password");
                    throw new Error("Missing credentials");
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: email
                    }
                })

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
            }
        })
    ],
    secret: process.env.NEXTAUTH_SECRET,
    session: {
      strategy: 'jwt',
    },
})