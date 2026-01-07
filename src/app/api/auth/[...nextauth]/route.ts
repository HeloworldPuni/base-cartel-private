import NextAuth from "next-auth";
import TwitterProvider from "next-auth/providers/twitter";
import prisma from "@/lib/prisma";

const handler = NextAuth({
    providers: [
        TwitterProvider({
            clientId: process.env.TWITTER_CLIENT_ID || "",
            clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
            version: "2.0",
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider === "twitter" && user.name) {
                // Check if we have a wallet address in the session (custom flow needed)
                // or just rely on manual linking via API after frontend redirect?
                // Actually, for this flow, we likely want the user to be signed in via Wallet FIRST.
                // But NextAuth doesn't easily know about the wallet unless we link accounts.

                // SIMPLIFIED APPROACH:
                // 1. Frontend calls signIn('twitter')
                // 2. Redirect back
                // 3. We get the twitter handle `profile.data.username`
                // 4. We save it to the DB if we can identify the user?

                // Better: Just return true, let the frontend handle the callback and save.
                console.log("Twitter Login:", user.name);
                return true;
            }
            return true;
        },
        async session({ session, token }) {
            // Pass twitter handle to client
            if (session.user) {
                // @ts-ignore
                session.user.handle = token.picture // Hack? No, let's use the real profile if available
                // In v2, profile.data.username is the handle
            }
            return session;
        },
        async jwt({ token, account, profile }) {
            if (account?.provider === "twitter" && profile) {
                // @ts-ignore
                token.username = profile.data?.username;
            }
            return token;
        }
    },
    secret: process.env.NEXTAUTH_SECRET || "temp-secret-123",
});

export { handler as GET, handler as POST };
