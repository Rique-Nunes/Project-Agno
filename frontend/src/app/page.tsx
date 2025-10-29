'use client';

import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Image from 'next/image';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-gray-800">
        <p>Carregando sessão...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Coluna da Esquerda (Sidebar) - Fina e sem conteúdo, como no modelo */}
      <div className="hidden md:flex items-center justify-center w-64 bg-indigo-800 p-6 border-r border-indigo-700">
        {/* O modelo antigo não exibia nada aqui, então deixamos em branco para replicar o visual */}
      </div>

      {/* Conteúdo do Login à Direita - Textos e estilo do modelo */}
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 p-8">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800">
            InfraSense
          </h1>
          <p className="mt-4 text-base text-gray-600">
            Sua plataforma inteligente para monitoramento e análise de infraestrutura, potencializada por IA.
          </p>
          <p className="mt-2 text-sm text-gray-500">Acesso Restrito</p>
          
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-md bg-white px-4 py-3 text-lg font-semibold text-gray-800 shadow-md transition-transform duration-200 hover:scale-105 border border-gray-200"
          >
            <Image
              src="/google-logo.svg"
              alt="Google logo"
              width={24}
              height={24}
            />
            Entrar com o Google
          </button>
        </div>
      </div>
    </div>
  );
}