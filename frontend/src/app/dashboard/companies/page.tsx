'use client';

import { useState, useEffect, FormEvent } from 'react';
import { PlusCircle, MoreHorizontal, X, Loader2, Trash2 } from 'lucide-react';
import fetchWithAuth from '@/lib/fetchwithauth';

interface Company {
    id: number;
    nome: string;
    url_zabbix: string;
    usuario_zabbix: string;
}

export default function CompaniesPage() {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Função para buscar as empresas
    const fetchCompanies = async () => {
        try {
            setIsLoading(true);
            const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/empresas`);
            if (!response.ok) throw new Error('Falha ao buscar empresas.');
            const data = await response.json();
            setCompanies(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Busca as empresas quando a página carrega
    useEffect(() => {
        fetchCompanies();
    }, []);

    // Função para deletar uma empresa
    const handleDelete = async (companyId: number) => {
        // Confirmação para evitar deleção acidental
        if (!window.confirm("Você tem certeza que deseja deletar esta empresa? Esta ação não pode ser desfeita.")) {
            return;
        }

        try {
            const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/empresas/${companyId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Falha ao deletar a empresa.');
            }

            // Remove a empresa da lista no estado local para atualizar a UI
            setCompanies(companies.filter(company => company.id !== companyId));

        } catch (err: any) {
            alert(`Erro: ${err.message}`);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Gerenciar Empresas</h1>
                <p className="text-gray-500 mt-1">Adicione, visualize e remova as empresas monitoradas.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Empresas Cadastradas</h2>
                    <button 
                        onClick={() => setModalIsOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors flex items-center"
                    >
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Adicionar Empresa
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b bg-gray-50">
                                <th className="p-3 text-sm font-semibold text-gray-600">Nome</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">URL do Zabbix</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">Usuário</th>
                                <th className="p-3 text-sm font-semibold text-gray-600">Token API</th>
                                <th className="p-3 text-sm font-semibold text-gray-600 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={5} className="text-center p-4">Carregando...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={5} className="text-center p-4 text-red-500">{error}</td></tr>
                            ) : companies.length === 0 ? (
                                <tr><td colSpan={5} className="text-center p-4 text-gray-500">Nenhuma empresa cadastrada.</td></tr>
                            ) : (
                                companies.map((company) => (
                                    <tr key={company.id} className="border-b hover:bg-gray-50">
                                        <td className="p-3 font-medium text-gray-800">{company.nome}</td>
                                        <td className="p-3 text-gray-600">{company.url_zabbix}</td>
                                        <td className="p-3 text-gray-600">{company.usuario_zabbix}</td>
                                        <td className="p-3 text-gray-600 font-mono">●●●●●●●●</td>
                                        <td className="p-3 text-center">
                                            {/* Botão de Deletar chama a função handleDelete */}
                                            <button onClick={() => handleDelete(company.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {modalIsOpen && (
                 <AddCompanyModal 
                    onClose={() => setModalIsOpen(false)} 
                    onSuccess={() => {
                        setModalIsOpen(false);
                        fetchCompanies(); // Recarrega a lista inteira para garantir consistência
                    }}
                />
            )}
        </div>
    );
}

// O componente AddCompanyModal permanece o mesmo
function AddCompanyModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError(null);
        
        const formData = new FormData(e.currentTarget);
        const newCompanyData = {
            nome: formData.get('nome') as string,
            url_zabbix: formData.get('url_zabbix') as string,
            usuario_zabbix: formData.get('usuario_zabbix') as string,
            token_zabbix: formData.get('token_zabbix') as string,
        };

        try {
            const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/empresas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCompanyData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(JSON.stringify(errorData.detail) || 'Falha ao adicionar empresa.');
            }
            onSuccess();
        } catch (err: any) {
            setFormError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
                <form onSubmit={handleSubmit}>
                    <div className="flex justify-between items-center p-6 border-b">
                        <h3 className="text-xl font-bold text-gray-800">Adicionar Nova Empresa</h3>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600"><X /></button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">Nome da Empresa</label>
                            <input type="text" name="nome" id="nome" required className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                        </div>
                        <div>
                            <label htmlFor="url_zabbix" className="block text-sm font-medium text-gray-700 mb-1">URL da API Zabbix</label>
                            <input type="url" name="url_zabbix" id="url_zabbix" placeholder="http://seu-zabbix.com/api_jsonrpc.php" required className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                        </div>
                        <div>
                            <label htmlFor="usuario_zabbix" className="block text-sm font-medium text-gray-700 mb-1">Usuário Zabbix</label>
                            <input type="text" name="usuario_zabbix" id="usuario_zabbix" required className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                        </div>
                         <div>
                            <label htmlFor="token_zabbix" className="block text-sm font-medium text-gray-700 mb-1">Token API</label>
                            <input type="password" name="token_zabbix" id="token_zabbix" required className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900" />
                        </div>
                        {formError && <p className="text-sm text-red-600">{formError}</p>}
                    </div>
                    <div className="flex justify-end p-6 bg-gray-50 rounded-b-lg">
                        <button type="button" onClick={onClose} className="mr-3 py-2 px-4 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200">Cancelar</button>
                        <button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md disabled:bg-indigo-300 flex items-center">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Adicionar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}