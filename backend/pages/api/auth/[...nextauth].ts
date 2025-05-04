// pages/api/auth/[...nextauth].ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { FirebaseAdapter } from "@next-auth/firebase-adapter";
import { cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import firebaseCredentials from "@/lib/firebase/admin"; // Certificado Firebase Admin

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  adapter: FirebaseAdapter({
    credential: cert(firebaseCredentials),
    db: getFirestore(),
  }),
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const auth = getAuth();
          const { uid } = await auth.getUserByEmail(user.email);
          
          // Cria token JWT personalizado
          const customToken = await auth.createCustomToken(uid);
          
          // Envia para o frontend
          user.customToken = customToken;
          return true;
        } catch (error) {
          console.error("Google sign-in error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user?.customToken) {
        token.customToken = user.customToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.customToken) {
        session.customToken = token.customToken;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  debug: process.env.NODE_ENV === "development",
};

export default NextAuth(authOptions);