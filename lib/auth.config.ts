import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";

export const authConfig = {
    // Trust the host in production (required for Amplify/serverless deployments)
    trustHost: true,
    pages: {
        signIn: "/login",
    },
    providers: [
        Credentials({
            id: "email-otp",
            name: "Email OTP",
            credentials: {
                email: { label: "Email", type: "email" },
                token: { label: "OTP Code", type: "text" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.token) {
                    return null;
                }

                const email = credentials.email as string;
                const token = credentials.token as string;

                // Verify the OTP token
                const verificationToken = await prisma.verificationToken.findFirst({
                    where: {
                        identifier: email,
                        token: token,
                        expires: {
                            gte: new Date(),
                        },
                    },
                });

                if (!verificationToken) {
                    return null;
                }

                // Delete the used token
                await prisma.verificationToken.delete({
                    where: {
                        id: verificationToken.id,
                    },
                });

                // Find user by email (include onboarding status)
                const user = await prisma.user.findUnique({
                    where: { email },
                    include: { onboarding: true }
                });

                if (!user) return null;
                if (!["admin", "partner", "strategic_partner"].includes(user.role)) return null;
                if (user.status == "suspended") return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.fullName,
                    role: user.role,
                    onboardingCompleted: user.onboarding?.has_finalized || false,
                    onboardingToken: user.onboarding?.token || null,
                };
            },
        }),
    ],
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnLogin = nextUrl.pathname.startsWith("/login");

            if (isOnLogin) {
                if (isLoggedIn) return Response.redirect(new URL("/analytics", nextUrl));
                return true;
            }

            return isLoggedIn;
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                const u = user as any;
                token.id = u.id;
                token.role = u.role;
                token.onboardingCompleted = u.onboardingCompleted;
                token.onboardingToken = u.onboardingToken;
            }
            if (trigger === "update" && session) {
                token.onboardingCompleted = session.onboardingCompleted;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                (session.user as any).role = token.role;
                (session.user as any).onboardingCompleted = token.onboardingCompleted;
                (session.user as any).onboardingToken = token.onboardingToken;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt" as const,
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    secret: process.env.AUTH_SECRET,
} satisfies NextAuthConfig;
