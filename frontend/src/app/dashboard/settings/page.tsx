'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import fetchWithAuth from '@/lib/fetchwithauth';
import { toast } from 'sonner';

interface UserProfile {
    nome: string;
    telefone: string;
    cargo: string;
    idioma_ia: string;
}

function SettingsCard({ title, description, children }: { title: string, description: string, children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 mt-1">{description}</p>
            </div>
            <div className="p-6 bg-gray-50/50">
                {children}
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const { data: session, update } = useSession();

    const [profile, setProfile] = useState<UserProfile>({
        nome: '',
        telefone: '',
        cargo: '',
        idioma_ia: 'portugues',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!session?.user) {
                setIsFetching(false);
                return;
            };

            setIsFetching(true);
            try {
                const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/me`);
                const data = await response.json();
                
                setProfile({
                    nome: data.nome || session.user.name || '',
                    telefone: data.telefone || '',
                    cargo: data.cargo || '',
                    idioma_ia: data.idioma_ia || 'portugues'
                });
            } catch (error) {
                console.error(error);
                toast.error('Não foi possível carregar seus dados de perfil.');
                // Garante que o nome seja preenchido mesmo em caso de erro na API
                const userName = session?.user?.name;
                if (userName) {
                    setProfile(prev => ({ ...prev, nome: userName }));
                }
            } finally {
                setIsFetching(false);
            }
        };
        fetchUserData();
    }, [session]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
                method: 'PATCH',
                body: JSON.stringify(profile),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Falha ao salvar o perfil.');
            }
            if (session?.user?.name !== profile.nome) {
                 await update({ name: profile.nome });
            }
            toast.success('Perfil atualizado com sucesso!');
        } catch (error: any) {
            toast.error(`Erro: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Configurações</h1>
                <p className="text-gray-500 mt-1">Gerencie seu perfil e as preferências da aplicação.</p>
            </div>

            <form onSubmit={handleSaveProfile}>
                <SettingsCard
                    title="Perfil do Usuário"
                    description="Edite suas informações pessoais e de contato."
                >
                    <div className="space-y-4">
                         <div className="flex items-center space-x-4">
                            {session?.user?.image && (
                                <Image src={session.user.image} alt="Avatar" width={48} height={48} className="w-12 h-12 rounded-full" />
                            )}
                            <div>
                                <p className="font-semibold text-gray-800">{profile.nome || 'Usuário'}</p>
                                <p className="text-sm text-gray-500">{session?.user?.email || 'Nenhum e-mail'}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome</label>
                                <input type="text" name="nome" id="nome" value={profile.nome} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md text-gray-900 bg-white" />
                            </div>
                             <div>
                                <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">Telefone</label>
                                <input type="tel" name="telefone" id="telefone" value={profile.telefone || ''} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md text-gray-900 bg-white" />
                            </div>
                             <div>
                                <label htmlFor="cargo" className="block text-sm font-medium text-gray-700">Cargo</label>
                                <input type="text" name="cargo" id="cargo" value={profile.cargo || ''} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md text-gray-900 bg-white" />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                             <button type="submit" disabled={isLoading} className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center">
                                {isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                Salvar Perfil
                            </button>
                        </div>
                    </div>
                </SettingsCard>
            </form>

            <SettingsCard
                title="Preferências da IA"
                description="Ajuste como você interage com o assistente de IA."
            >
                 <div className="space-y-2">
                    <label htmlFor="idioma_ia" className="block text-sm font-medium text-gray-700">Idioma de Resposta</label>
                    <select
                        id="idioma_ia"
                        name="idioma_ia"
                        value={profile.idioma_ia}
                        onChange={handleInputChange}
                        className="mt-1 w-full md:w-1/2 p-2 border rounded-md text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="portugues">Português</option>
                        <option value="ingles">Inglês</option>
                    </select>
                    <p className="text-xs text-gray-500 pt-1">
                        Para salvar a preferência de idioma, clique em "Salvar Perfil" na seção acima.
                    </p>
                </div>
            </SettingsCard>
        </div>
    );
}