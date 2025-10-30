import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { jwtDecode } from "jwt-decode";

// Estendendo o tipo Session para incluir a role
declare module "next-auth" {
  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null; // Adicionamos a role aqui
    };
    accessToken?: string;
    error?: string;
  }
  interface User {
      role?: string | null; // E aqui também
  }
}

// Estendendo o tipo JWT para incluir a role
declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    accessToken?: string;
  }
}


export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        try {
          const response = await fetch(`${process.env.API_URL}/auth/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token: account.id_token }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error("Erro ao obter token do backend:", errorData.detail || response.statusText);
            token.error = "Failed to fetch access token from backend";
            return token;
          }

          const { access_token } = await response.json();
          
          if (access_token) {
            token.accessToken = access_token;
            const decodedToken: { role?: string } = jwtDecode(access_token);
            token.role = decodedToken.role;
          }
        } catch (error) {
            console.error("Erro de rede ou de parsing ao contatar o backend:", error);
            token.error = "Network or parsing error";
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Passa a role e o accessToken do objeto token para o objeto session.
      // Agora o useSession() terá acesso a esses dados.
      if (token && session.user) {
        session.user.role = token.role;
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    signOut: '/',
    error: '/',
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};