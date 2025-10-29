'use client';

import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Bell, Menu } from 'lucide-react'; // Adicionar o ícone Menu
import { useDashboard } from '@/contexts/DashboardContext';

// Tipagem para as props do Header
interface HeaderProps {
    toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
    const { data: session } = useSession();
    const { companies, isLoadingCompanies, error, selectedCompanyId, setSelectedCompanyId } = useDashboard();

    const handleCompanyChange = (newCompanyId: string) => {
        // A lógica de reload foi removida para uma experiência mais fluida
        setSelectedCompanyId(newCompanyId);
    };

    return (
        <header className="h-20 flex-shrink-0 flex items-center justify-between px-4 sm:px-8 border-b bg-white">
            <div className="flex items-center space-x-4">
                {/* Botão Hamburguer - aparece apenas em telas menores que 'md' */}
                <button 
                    onClick={toggleSidebar}
                    className="md:hidden text-gray-600 hover:text-gray-900"
                    aria-label="Abrir menu"
                >
                    <Menu size={24} />
                </button>

                <div className="hidden sm:flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-600">Empresa:</span>
                    
                    {isLoadingCompanies ? (
                        <p className="text-sm text-gray-500">Carregando...</p>
                    ) : error ? (
                         <p className="text-sm text-red-500">Erro</p>
                    ) : (
                        <select
                            value={selectedCompanyId || ''}
                            onChange={(e) => handleCompanyChange(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md shadow-sm text-gray-800 bg-white"
                            disabled={companies.length === 0}
                        >
                            {companies.length > 0 ? (
                                companies.map(company => (
                                    <option key={company.id} value={company.id}>{company.nome}</option>
                                ))
                            ) : (
                                <option>Nenhuma empresa</option>
                            )}
                        </select>
                    )}
                </div>
            </div>
            <div className="flex items-center space-x-3 sm:space-x-6">
                <button className="text-gray-500 hover:text-gray-800">
                    <Bell className="w-6 h-6" />
                </button>
                <div className="flex items-center space-x-3">
                    {session?.user?.image && (
                        <Image
                            src={session.user.image}
                            alt="User avatar"
                            width={40}
                            height={40}
                            className="rounded-full"
                        />
                    )}
                    <div className="hidden sm:block">
                        <p className="font-semibold text-gray-800">{session?.user?.name || 'Usuário'}</p>
                        <p className="text-sm text-gray-500">{session?.user?.email}</p>
                    </div>
                </div>
            </div>
        </header>
    );
}