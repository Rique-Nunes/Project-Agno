'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import fetchWithAuth from '@/lib/fetchwithauth';
import { useDashboard } from '@/contexts/DashboardContext';
import { Loader2, AlertTriangle, Server, Bot, ShieldCheck, X, ChevronDown, ChevronUp, CheckCircle2, Clock } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import AlertHistoryInteractive from '@/components/dashboard/alert-history';
import EventLog from '@/components/dashboard/event-log';
import TopConsumers from '@/components/dashboard/top-consumers';

// Interfaces
interface ZabbixHost { hostid: string; name: string; }
// Add lastchange to the Alert interface
interface Alert { triggerid: string; description: string; priority: string; hosts: { name: string }[]; lastchange: string; }
interface EventLogEntry { eventid: string; time: string; description: string; priority: string; host: string; status: 'PROBLEMA' | 'RESOLVIDO'; }
interface Consumer { name: string; value: number; }
type Period = "24h" | "7d" | "30d";

export default function DashboardPage() {
    // 1. Obter a sessão para saber o papel do usuário
    const { data: session, status } = useSession();
    const {
        selectedCompanyId,
        setSelectedCompanyId,
        companies,
        step,
        setStep,
        hosts
    } = useDashboard();

    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [eventLog, setEventLog] = useState<EventLogEntry[]>([]);
    const [topCpu, setTopCpu] = useState<Consumer[]>([]);
    const [topMemory, setTopMemory] = useState<Consumer[]>([]);
    const [period, setPeriod] = useState<Period>('24h');

    const [isLoadingPageData, setIsLoadingPageData] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [pageError, setPageError] = useState<string | null>(null);
    const [isTimelineExpanded, setIsTimelineExpanded] = useState(false); // 1. Adicionar estado de expansão

    // Add this function inside the DashboardPage component
    const getStatusProps = (status: 'PROBLEMA' | 'RESOLVIDO') => {
        if (status === 'PROBLEMA') {
            return {
                Icon: AlertTriangle,
                bgColor: 'bg-red-100',
                iconColor: 'text-red-600',
                tagBgColor: 'bg-yellow-500',
                tagTextColor: 'text-white',
                text: 'PROBLEMA',
            };
        }
        return {
            Icon: CheckCircle2,
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600',
            tagBgColor: 'bg-blue-500',
            tagTextColor: 'text-white',
            text: 'RESOLVIDO',
        };
    };

    const fetchDataForDashboard = useCallback(async (isInitialLoad = false) => {
        if (!selectedCompanyId) return;

        if (isInitialLoad) {
            setIsLoadingPageData(true);
            setAiResponse(null);
        }
        setPageError(null);

        try {
            const [alertsRes, eventLogRes, topConsumersRes] = await Promise.all([
                fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/zabbix/alerts/history/${selectedCompanyId}?period=${period}`),
                fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/zabbix/events/log/${selectedCompanyId}?period=${period}`),
                fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/zabbix/metrics/top_consumers/${selectedCompanyId}`),
            ]);

            if (!alertsRes.ok) throw new Error("Falha ao carregar histórico de alertas.");
            if (!eventLogRes.ok) throw new Error("Falha ao carregar log de eventos.");
            if (!topConsumersRes.ok) throw new Error("Falha ao carregar maiores consumidores de recursos.");

            const topConsumersJson = await topConsumersRes.json();
            setAlerts(await alertsRes.json());
            setEventLog(await eventLogRes.json());
            setTopCpu(topConsumersJson.top_cpu);
            setTopMemory(topConsumersJson.top_memory);

        } catch (err: any) {
            setPageError(err.message);
            setStep('selectCompany');
        } finally {
            if (isInitialLoad) setIsLoadingPageData(false);
        }
    }, [selectedCompanyId, period, setStep]);

    useEffect(() => {
        if (selectedCompanyId && step === 'viewDashboard') {
            fetchDataForDashboard(true);
            const intervalId = setInterval(() => { fetchDataForDashboard(false); }, 30000);
            return () => clearInterval(intervalId);
        }
    }, [selectedCompanyId, period, step, fetchDataForDashboard]);

    // Adicione esta linha para criar a lista de eventos a ser exibida
    const displayedEvents = isTimelineExpanded ? eventLog : eventLog.slice(0, 4);

    // --- CORREÇÃO: Função removida, a lógica será in-line ---
    // const handleCompanySelect = (companyId: string) => {
    //     setSelectedCompanyId(companyId);
    //     setStep('viewDashboard');
    // };

    const handleAiAnalysis = async () => {
        if (!selectedCompanyId) return;
        setIsAiLoading(true);
        setAiResponse(null);

        const alertSummary = (alerts || []).slice(0, 10).map(a => `- ${a.description} (Host: ${a.hosts[0]?.name || 'N/A'})`).join('\n');

        const prompt = `
            Como um Analista SRE Sênior, sua tarefa é fornecer uma análise aprofundada da saúde de um ambiente Zabbix. Seja técnico, preciso e proativo.

            **DADOS DISPONÍVEIS:**
            - **Período de Análise:** ${period === '24h' ? 'Últimas 24 horas' : period === '7d' ? 'Últimos 7 dias' : 'Últimos 30 dias'}
            - **Total de Hosts Monitorados:** ${hosts.length}
            - **Resumo de Problemas Atuais/Recentes:**
            ${alertSummary || "Nenhum problema encontrado."}
            
            **ESTRUTURA DA SUA ANÁLISE:**

            **1. Diagnóstico Geral:**
            Comece com uma avaliação concisa da saúde do ambiente (ex: Estável, Sob Observação, Requer Atenção). Baseie seu diagnóstico nos problemas encontrados.

            **2. Pontos de Atenção Detalhados:**
            Liste os principais riscos ou observações. Se houver problemas, quais são os mais preocupantes? Se não houver, isso é bom ou pode indicar triggers mal configurados (muito permissivos)?

            **3. Recomendações Técnicas e Proativas:**
            Forneça uma lista de ações claras e práticas para resolver os problemas ou melhorar o monitoramento.
        `;

        try {
            const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/chat/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: prompt, empresa_id: parseInt(selectedCompanyId) }),
            });

            // --- 2. LÓGICA DE ERRO MELHORADA ---
            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error('Você não tem permissão para usar o assistente de IA. É necessário o nível de "Operador" ou superior.');
                }
                const errorData = await response.json().catch(() => null);
                const detail = errorData?.detail || 'Falha ao obter análise da IA.';
                throw new Error(detail);
            }
            const data = await response.json();
            setAiResponse(data.response);
        } catch (err: any) {
            // Aqui, em vez de setar a resposta, setamos o erro para ser exibido em um componente de erro
            setAiResponse(`**Erro ao buscar análise:**\n\n${err.message}`);
        } finally {
            setIsAiLoading(false);
        }
    };

    if (status === 'loading') {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-8 w-8 text-indigo-600" /></div>;
    }

    if (step === 'selectCompany' || !selectedCompanyId) {
        return (
            <div className="flex flex-col justify-center items-center h-screen bg-gray-50">
                <div className="text-center p-8 bg-white rounded-xl shadow-lg">
                    <ShieldCheck className="mx-auto h-16 w-16 text-indigo-600 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Bem-vindo ao Zabbix Copilot</h1>
                    
                    {companies.length === 0 ? (
                        <>
                            <p className="text-gray-600 mb-6">Nenhuma empresa cadastrada ainda. Cadastre uma empresa para começar a usar o sistema.</p>
                            <button 
                                onClick={() => window.location.href = '/empresas'}
                                className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-transform transform hover:scale-105">
                                Cadastrar Primeira Empresa
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-gray-600 mb-6">Por favor, selecione uma empresa para visualizar o dashboard.</p>
                            <div className="flex flex-wrap justify-center gap-4">
                                {companies.map(company => (
                                    // --- INÍCIO DA CORREÇÃO ---
                                    // Chamamos as duas funções do contexto diretamente no onClick.
                                    // A ordem é importante: primeiro o ID, depois o passo.
                                    <button key={company.id} onClick={() => {
                                        setSelectedCompanyId(company.id.toString());
                                        setStep('viewDashboard');
                                    }}
                                        className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 transition-transform transform hover:scale-105">
                                        {company.nome}
                                    </button>
                                    // --- FIM DA CORREÇÃO ---
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        );
    }

    const selectedCompanyName = companies.find(c => c.id.toString() === selectedCompanyId)?.nome || 'Empresa';

    // Move the console.log here, before the return statement
    console.log("DashboardPage -> Enviando para AlertHistory:", alerts);

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-gray-900">Visão Geral da Empresa: {selectedCompanyName}</h1>
                    <div className="flex items-center bg-white p-1 rounded-lg shadow-sm border">
                        {(['24h', '7d', '30d'] as Period[]).map(p => (
                            <button key={p} onClick={() => setPeriod(p)}
                                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors ${period === p ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>
                                {p === '24h' ? '24 Horas' : p === '7d' ? '7 Dias' : '30 Dias'}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoadingPageData && <div className="text-center p-10"><Loader2 className="animate-spin h-8 w-8 text-indigo-600 mx-auto" /></div>}
                
                {pageError && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md" role="alert">
                        <p className="font-bold">Ocorreu um Erro</p>
                        <p>{pageError}</p>
                    </div>
                )}

                {!isLoadingPageData && !pageError && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md flex flex-col">
                                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2 flex-shrink-0">
                                    <Bot className="text-indigo-600" /> Análise do Ambiente com IA
                                </h2>
                                <div className="flex-grow overflow-hidden">
                                    {aiResponse ? (
                                        <>
                                            <div className="prose prose-sm max-w-none text-gray-700 mb-4 max-h-96 overflow-y-auto pr-2">
                                                <ReactMarkdown>{aiResponse}</ReactMarkdown>
                                            </div>
                                            <div className="flex items-center gap-4 mt-auto pt-4 border-t border-gray-200">
                                                <button onClick={handleAiAnalysis} disabled={isAiLoading}
                                                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 disabled:bg-indigo-400 flex items-center gap-2">
                                                    {isAiLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                                                    {isAiLoading ? 'Analisando...' : 'Gerar Nova Análise'}
                                                </button>
                                                <button onClick={() => setAiResponse(null)}
                                                    className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 flex items-center gap-2">
                                                    <X className="h-4 w-4" /> Fechar
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm text-gray-500 flex-grow">
                                                Clique no botão para gerar uma análise completa do ambiente, incluindo diagnóstico, pontos de atenção e recomendações.
                                            </p>
                                            <div className="mt-auto pt-4">
                                                {/* --- 3. BOTÃO DESABILITADO PARA VIEWERS --- */}
                                                <button onClick={handleAiAnalysis} disabled={isAiLoading || session?.user?.role === 'viewer'}
                                                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75 disabled:bg-indigo-400 flex items-center gap-2">
                                                    {isAiLoading ? <Loader2 className="animate-spin h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                                                    {isAiLoading ? 'Analisando...' : 'Gerar Análise'}
                                                </button>
                                                {session?.user?.role === 'viewer' && (
                                                    <p className="text-xs text-yellow-600 mt-2">Permissão de Operador ou superior necessária para esta ação.</p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-4">
                               <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Hosts Monitorados</p>
                                        <p className="text-3xl font-bold text-gray-900">{hosts.length}</p>
                                    </div>
                                    <Server className="h-10 w-10 text-green-500" />
                                </div>
                                <div className="bg-white p-6 rounded-lg shadow-md flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Problemas Ativos</p>
                                        <p className="text-3xl font-bold text-gray-900">{(alerts || []).length}</p>
                                    </div>
                                    <AlertTriangle className={`h-10 w-10 ${(alerts || []).length > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                                </div>
                            </div>
                        </div>

                        <TopConsumers 
                            topCpu={topCpu}
                            topMemory={topMemory}
                            isLoading={isLoadingPageData} 
                        />

                        {/* Event Timeline */}
                        <div className="bg-white p-6 rounded-lg shadow-md">
                            {/* CABEÇALHO ATUALIZADO */}
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Linha do Tempo de Eventos
                                </h2>
                                {/* Botão movido para cá */}
                                {eventLog.length > 4 && (
                                    <button
                                        onClick={() => setIsTimelineExpanded(!isTimelineExpanded)}
                                        className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm flex items-center"
                                    >
                                        {isTimelineExpanded ? (
                                            <>
                                                Ver menos <ChevronUp size={16} className="ml-1" />
                                            </>
                                        ) : (
                                            <>
                                                Ver mais ({eventLog.length - 4} ocultos){" "}
                                                <ChevronDown size={16} className="ml-1" />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            
                            {isLoadingPageData ? (
                                <div className="flex justify-center items-center h-40">
                                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                                </div>
                            ) : (
                                <div className="space-y-6 max-h-[450px] overflow-y-auto pr-4">
                                    {displayedEvents.length > 0 ? (
                                        displayedEvents.map((event) => {
                                            const {
                                                Icon,
                                                bgColor,
                                                iconColor,
                                                tagBgColor,
                                                tagTextColor,
                                                text,
                                            } = getStatusProps(event.status);
                                            return (
                                                <div key={event.eventid} className="flex items-start">
                                                    <div
                                                        className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center mr-4 ${bgColor}`}
                                                    >
                                                        <Icon className={iconColor} />
                                                    </div>
                                                    <div className="flex-grow">
                                                        <p className="font-semibold text-gray-800">
                                                            {event.host}:{" "}
                                                            <span className="font-normal text-gray-600">
                                                                {event.description}
                                                            </span>
                                                        </p>
                                                        <p className="text-sm text-gray-500 flex items-center mt-1">
                                                            <Clock size={14} className="mr-1.5" />
                                                            {event.time}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`ml-4 px-3 py-1 text-xs font-semibold rounded-full ${tagBgColor} ${tagTextColor}`}
                                                    >
                                                        {text}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-center text-gray-500 py-8">
                                            Nenhum evento registrado no período.
                                        </p>
                                    )}

                                    {/* O botão antigo foi removido daqui */}
                                </div>
                            )}
                        </div>
                        
                        {/* PONTO DE DEBUG: Ver o que está sendo enviado */}
                        {/* The console.log is removed from here */}
                        <AlertHistoryInteractive alerts={alerts} isLoading={isLoadingPageData} selectedCompanyId={selectedCompanyId} />
                    </div>
                )}
            </div>
        </div>
    );
}