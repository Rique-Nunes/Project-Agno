'use client';

import { useState, useEffect } from 'react';

export default function TestApiPage() {
  const [apiStatus, setApiStatus] = useState<string>('Carregando...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkApiStatus() {
      try {
        const response = await fetch('http://localhost:8000/api/v1/status');
        
        if (!response.ok) {
          throw new Error(`Erro na requisição: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setApiStatus(data.status || 'Status desconhecido');
      } catch (err: any) {
        console.error('Falha ao conectar com o backend:', err);
        setError(`Não foi possível conectar ao backend. Verifique se ele está rodando na porta 8000. Detalhes: ${err.message}`);
        setApiStatus('Falha na conexão');
      }
    }

    checkApiStatus();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <div className="container mx-auto p-8 rounded-lg shadow-xl bg-gray-800 text-center">
        <h1 className="text-4xl font-bold mb-4">Teste de Comunicação Frontend ↔ Backend</h1>
        <p className="text-lg mb-6">Esta página verifica a conexão com a API FastAPI.</p>
        
        <div className="p-4 rounded-md text-2xl font-mono">
          {error ? (
            <div className="text-red-400 bg-red-900 p-4 rounded-md">
              <p className="font-bold">Erro:</p>
              <p>{error}</p>
            </div>
          ) : (
            <p>
              Status da API: 
              <span className={`ml-2 px-3 py-1 rounded-full ${
                apiStatus === 'running' ? 'bg-green-500 text-green-900' : 'bg-yellow-500 text-yellow-900'
              }`}>
                {apiStatus}
              </span>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}