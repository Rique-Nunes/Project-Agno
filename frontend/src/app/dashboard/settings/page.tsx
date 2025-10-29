'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Importado
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
    const router = useRouter(); // Adicionado

    // Redireciona o usuário para o dashboard principal
    useEffect(() => {
        router.replace('/dashboard');
    }, [router]);

    // O restante do código não será executado por causa do redirecionamento.
    // O retorno abaixo mostra um loader enquanto o redirecionamento ocorre.
    return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
        </div>
    );

    /*
    // Lógica original da página (agora inativa)
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
            ...
        </div>
    );
    */
}