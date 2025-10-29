import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const { pathname } = req.nextUrl;

  // Se o usuário está logado (tem token)
  if (token) {
    // e tenta acessar a página inicial, redireciona para o dashboard
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Se o usuário NÃO está logado (não tem token)
  if (!token) {
    // e tenta acessar qualquer página protegida (dentro de /dashboard)
    if (pathname.startsWith('/dashboard')) {
      // redireciona para a página de login (página inicial)
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  // Se nenhuma das condições acima for atendida, continua a navegação normal
  return NextResponse.next();
}

// O matcher define quais rotas ativarão o middleware
export const config = {
  matcher: [
    /*
     * Corresponde a todas as rotas, exceto as que começam com:
     * - api (rotas de API)
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico (ícone)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};