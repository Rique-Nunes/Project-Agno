'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import fetchWithAuth from '@/lib/fetchwithauth';

// --- Interfaces ---
interface Empresa {
  id: number;
  nome: string;
}
interface NovaEmpresa {
  nome: string;
  url_zabbix: string;
  token_zabbix: string;
}

export default function EmpresasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<NovaEmpresa>({
    nome: '',
    url_zabbix: '',
    token_zabbix: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // --- Funções de API ---
  async function fetchEmpresas() {
    setError(null);
    setLoading(true);
    try {
      const response = await fetchWithAuth('http://localhost:8000/empresas');
      if (!response.ok) {
        if (response.status === 401) throw new Error('Não autorizado. Por favor, faça login novamente.');
        throw new Error('Falha ao buscar dados das empresas.');
      }
      const data = await response.json();
      setEmpresas(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    if (!formData.nome || !formData.url_zabbix || !formData.token_zabbix) {
      setFormError('Todos os campos são obrigatórios.');
      return;
    }
    try {
      const response = await fetchWithAuth('http://localhost:8000/empresas', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error((await response.json()).detail || 'Falha ao cadastrar empresa.');
      setIsModalOpen(false);
      setFormData({ nome: '', url_zabbix: '', token_zabbix: '' });
      fetchEmpresas();
    } catch (err: any) {
      setFormError(err.message);
    }
  }

  // --- NOVA FUNÇÃO: Lógica de Seleção ---
  async function handleSelectEmpresa(empresaId: number) {
    try {
      setError(`Selecionando empresa ID: ${empresaId}...`);
      const response = await fetchWithAuth(`http://localhost:8000/empresas/${empresaId}`);
      if (!response.ok) {
        throw new Error('Não foi possível obter os detalhes da empresa.');
      }
      const empresaDetails = await response.json();

      // Salva os detalhes no sessionStorage para uso em outras páginas
      sessionStorage.setItem('empresaAtiva', JSON.stringify(empresaDetails));

      // Redireciona para o dashboard (vamos criar essa página em breve)
      router.push('/dashboard'); 

    } catch (err: any) {
      setError(err.message);
    }
  }
  
  // --- Hooks de Efeito ---
  useEffect(() => {
    if (status === 'authenticated') {
      fetchEmpresas();
    } else if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status]);

  if (status === 'loading') {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white">
            <p>Verificando autenticação...</p>
        </main>
    )
  }

  // --- Renderização do Componente ---
  return (
    <main className="flex min-h-screen flex-col items-center p-8">
      <div className="w-full max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-cyan-400">Gerenciar Empresas</h1>
          <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 font-bold text-white bg-cyan-600 rounded-md hover:bg-cyan-700 transition-colors">
            Adicionar Nova Empresa
          </button>
        </div>
        
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          {loading && <p>Carregando empresas...</p>}
          {error && <p className="text-red-400">Erro: {error}</p>}
          {!loading && !error && (
            <ul className="space-y-4">
              {empresas.length > 0 ? (
                empresas.map((empresa) => (
                  <li key={empresa.id} className="p-4 bg-gray-700 rounded-md flex justify-between items-center">
                    <span className="font-semibold text-lg">{empresa.nome}</span>
                    {/* Botão agora chama a nova função */}
                    <button 
                      onClick={() => handleSelectEmpresa(empresa.id)}
                      className="px-3 py-1.5 text-sm font-bold text-white bg-cyan-500 rounded-md hover:bg-cyan-600"
                    >
                      Selecionar
                    </button>
                  </li>
                ))
              ) : (
                <p className="text-center text-gray-400">Nenhuma empresa cadastrada ainda.</p>
              )}
            </ul>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-lg">
            <h2 className="text-2xl font-bold mb-6 text-cyan-400">Nova Empresa</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                <label htmlFor="nome" className="block mb-2 text-sm font-medium text-gray-300">Nome da Empresa</label>
                <input type="text" id="nome" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-cyan-500 focus:border-cyan-500" />
              </div>
              <div>
                <label htmlFor="url_zabbix" className="block mb-2 text-sm font-medium text-gray-300">URL da API Zabbix</label>
                <input type="text" id="url_zabbix" placeholder="ex: http://zabbix.suaempresa.com/api_jsonrpc.php" value={formData.url_zabbix} onChange={(e) => setFormData({ ...formData, url_zabbix: e.target.value })} className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-cyan-500 focus:border-cyan-500" />
              </div>
              <div>
                <label htmlFor="token_zabbix" className="block mb-2 text-sm font-medium text-gray-300">Token da API Zabbix</label>
                <input type="password" id="token_zabbix" value={formData.token_zabbix} onChange={(e) => setFormData({ ...formData, token_zabbix: e.target.value })} className="w-full p-2.5 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-cyan-500 focus:border-cyan-500" />
              </div>
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-white bg-gray-600 rounded-md hover:bg-gray-700">Cancelar</button>
                <button type="submit" className="px-4 py-2 text-white bg-cyan-600 rounded-md hover:bg-cyan-700">Salvar Empresa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}