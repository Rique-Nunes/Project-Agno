'use client';

import { useState } from 'react';
import { Bot, Send, Loader2, X } from 'lucide-react';
import fetchWithAuth from '@/lib/fetchwithauth';
import ReactMarkdown from 'react-markdown';
// Adicionar useSession para obter o papel do usuário
import { useSession } from 'next-auth/react';

interface HostAIChatProps {
  hostId: string;
  empresaId: string;
  hostName: string;
}

export default function HostAIChat({ hostId, empresaId, hostName }: HostAIChatProps) {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Obter o papel do usuário logado
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/chat/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          question: `[Host: ${hostName}] ${question}`,
          empresa_id: parseInt(empresaId)
        }),
      });

      // --- LÓGICA DE ERRO CORRIGIDA ---
      if (!response.ok) {
        // Se o status for 403, é um erro de permissão.
        if (response.status === 403) {
          // Lançamos um erro com uma mensagem específica.
          throw new Error('Você não tem permissão para usar o assistente de IA. É necessário o nível de "Operador" ou superior.');
        }

        // Para outros erros (500, etc.), tentamos ler o detalhe do erro vindo do backend.
        const errorData = await response.json().catch(() => null); // .catch() para evitar erro se o corpo não for JSON
        const detail = errorData?.detail || 'Falha ao obter resposta da IA. Tente novamente mais tarde.';
        throw new Error(detail);
      }

      const data = await response.json();
      setResponse(data.response);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setResponse(null);
    setQuestion('');
    setError(null);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Bot className="text-indigo-600" />
        Análise com IA - {hostName}
      </h2>

      <p className="text-sm text-gray-600 mb-4">
        Faça perguntas específicas sobre este host. A IA analisará as métricas e alertas atuais.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex: Por que a CPU está alta? Quais são os principais problemas?"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 disabled:bg-gray-100"
            // --- 3. DESABILITAR CAMPO PARA VIEWERS ---
            disabled={isLoading || userRole === 'viewer'}
          />
          <button
            type="submit"
            // --- 4. DESABILITAR BOTÃO PARA VIEWERS ---
            disabled={isLoading || !question.trim() || userRole === 'viewer'}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-indigo-400 flex items-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            {isLoading ? 'Analisando...' : 'Enviar'}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p className="font-bold">Erro</p>
          <p>{error}</p>
        </div>
      )}

      {response && (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-800">Resposta da IA</h3>
            <button
              onClick={handleClear}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="prose prose-sm max-w-none text-gray-700">
            <ReactMarkdown>{response}</ReactMarkdown>
          </div>
        </div>
      )}

      {!response && !error && (
        <div className="mt-4 text-sm text-gray-500">
          <p className="font-semibold mb-2">Exemplos de perguntas:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Por que a CPU está alta?</li>
            <li>Quais são os principais problemas deste host?</li>
            <li>Como está o uso de memória?</li>
            <li>Há algum alerta crítico ativo?</li>
            <li>Recomende ações para melhorar a performance</li>
          </ul>
        </div>
      )}
    </div>
  );
}
