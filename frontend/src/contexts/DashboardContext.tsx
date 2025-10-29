'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import fetchWithAuth from '@/lib/fetchwithauth';

type Step = 'selectCompany' | 'viewDashboard';

interface Company {
  id: number;
  nome: string;
}

// Adicionada interface para Host
interface ZabbixHost {
  hostid: string;
  name: string;
}

interface DashboardContextType {
  step: Step;
  setStep: (step: Step) => void;
  selectedCompanyId: string;
  setSelectedCompanyId: (id: string) => void;
  companies: Company[];
  isLoadingCompanies: boolean;
  error: string | null;
  // Novas propriedades para gerenciar hosts
  hosts: ZabbixHost[];
  isLoadingHosts: boolean;
  selectedHostId: string;
  setSelectedHostId: (id: string) => void;
}

export const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const getInitialStep = (): Step => (typeof window !== 'undefined' && sessionStorage.getItem('dashboardStep') as Step) || 'selectCompany';
  const getInitialCompanyId = (): string => (typeof window !== 'undefined' && sessionStorage.getItem('selectedCompanyId')) || '';

  const [step, setStep] = useState<Step>('selectCompany'); // Inicia com o padrão para evitar erro de hidratação
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(''); // Idem
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Novos estados para hosts
  const [hosts, setHosts] = useState<ZabbixHost[]>([]);
  const [isLoadingHosts, setIsLoadingHosts] = useState(false);
  const [selectedHostId, setSelectedHostId] = useState('');

  useEffect(() => {
    // Restaura o estado do sessionStorage apenas no lado do cliente
    setSelectedCompanyId(getInitialCompanyId());
    setStep(getInitialStep());
  }, []);

  const handleSetStep = (newStep: Step) => {
    sessionStorage.setItem('dashboardStep', newStep);
    setStep(newStep);
  };

  const handleSetSelectedCompanyId = (newId: string) => {
    sessionStorage.setItem('selectedCompanyId', newId);
    if (!newId) {
        handleSetStep('selectCompany');
    }
    setSelectedCompanyId(newId);
  };
  
  // Efeito para buscar empresas (existente)
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setError(null);
        setIsLoadingCompanies(true);
        // --- ALTERAÇÃO AQUI ---
        // Alteramos a rota de '/empresas' para '/me/empresas' para buscar
        // apenas as empresas associadas ao usuário logado.
        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/me/empresas`);
        if (!response.ok) throw new Error('Falha ao carregar as empresas.');
        setCompanies(await response.json());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    fetchCompanies();
  }, []);

  // Novo efeito para buscar hosts quando a empresa muda
  useEffect(() => {
    if (selectedCompanyId) {
      const fetchHosts = async () => {
        setIsLoadingHosts(true);
        try {
          const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/zabbix/hosts/${selectedCompanyId}`);
          if (!response.ok) throw new Error('Falha ao carregar hosts.');
          setHosts(await response.json());
        } catch (err: any) {
          // Poderíamos ter um erro específico para hosts aqui
          setError(err.message);
        } finally {
          setIsLoadingHosts(false);
        }
      };
      fetchHosts();
    } else {
      setHosts([]); // Limpa a lista de hosts se nenhuma empresa estiver selecionada
    }
  }, [selectedCompanyId]);

  return (
    <DashboardContext.Provider 
      value={{ 
        step, 
        setStep: handleSetStep, 
        selectedCompanyId, 
        setSelectedCompanyId: handleSetSelectedCompanyId, 
        companies, 
        isLoadingCompanies, 
        error,
        hosts,
        isLoadingHosts,
        selectedHostId,
        setSelectedHostId
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};