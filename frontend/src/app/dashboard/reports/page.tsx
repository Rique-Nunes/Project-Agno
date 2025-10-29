'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Loader2, AlertCircle, Download, Bot, Server, Activity, Clock, ShieldCheck, AlertTriangle, CheckCircle, Info, Calendar, BarChart3, TrendingUp, Settings, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { marked } from 'marked';
import { useDashboard } from '@/contexts/DashboardContext';
import fetchWithAuth from '@/lib/fetchwithauth'; // Caminho ajustado para o projeto de destino

interface ReportData {
    period: string;
    host_name: string;
    company_name: string;
    total_events: number;
    critical_events: number;
    warning_events: number;
    avg_resolution_time: string;
    top_problems: Array<{description: string; frequency: number}>;
    resource_trends: {
        cpu_avg: string;
        memory_avg: string;
        disk_avg: string;
        trend_direction: 'improving' | 'stable' | 'degrading';
    };
    recommendations: string[];
    generated_at: string;
}

export default function ReportsPage() {
    const { selectedCompanyId, companies, hosts, isLoadingHosts } = useDashboard();
    
    const [selectedHostId, setSelectedHostId] = useState('');
    const [inventorySearchTerm, setInventorySearchTerm] = useState(''); // Estado para o filtro do inventário
    const [reportHostSearchTerm, setReportHostSearchTerm] = useState(''); // Estado para a seleção do relatório
    const [showHostDropdown, setShowHostDropdown] = useState(false);
    const reportHostInputRef = useRef<HTMLInputElement>(null); // Ref para focar no input do relatório
    const [reportPeriod, setReportPeriod] = useState<'7d' | '30d' | 'custom'>('7d');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [reportType, setReportType] = useState<'performance' | 'capacity' | 'incidents' | 'executive'>('performance');
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const [reportData, setReportData] = useState<ReportData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [inventoryRows, setInventoryRows] = useState<any[] | null>(null);
    const [aiPrompt, setAiPrompt] = useState('');

    const selectedCompany = companies.find(c => c.id.toString() === selectedCompanyId);
    const selectedHost = hosts.find(h => h.hostid === selectedHostId);
    
    // Agora filtra baseado no campo de busca do relatório
    const filteredHosts = hosts.filter(host => 
        host.name.toLowerCase().includes(reportHostSearchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.host-search-container')) {
                setShowHostDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleHostSelect = (hostId: string, hostName: string) => {
        setSelectedHostId(hostId);
        setReportHostSearchTerm(hostName); // Atualiza o campo de busca do relatório
        setShowHostDropdown(false);
    };

    const handleHostSearchChange = (value: string) => {
        setReportHostSearchTerm(value); // Atualiza o campo de busca do relatório
        setShowHostDropdown(true);
        if (!value) {
            setSelectedHostId('');
        }
    };

    const handleClearReportHostSelection = () => {
        setSelectedHostId('');
        setReportHostSearchTerm('');
        setShowHostDropdown(true);
        reportHostInputRef.current?.focus();
    };

    const handleClearReport = () => {
        setReport(null);
        setReportData(null);
        setError(null);
    };

    const getReportTypeDescription = () => {
        switch (reportType) {
            case 'performance': return 'Análise de performance e otimização de recursos';
            case 'capacity': return 'Análise de capacidade e planejamento de crescimento';
            case 'incidents': return 'Análise de incidentes e tempo de resolução';
            case 'executive': return 'Relatório executivo com visão estratégica';
            default: return '';
        }
    };

    const handleGenerateReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHostId) {
            setError('Por favor, selecione um servidor para gerar o relatório.');
            return;
        }

        if (reportPeriod === 'custom' && (!customStartDate || !customEndDate)) {
            setError('Para período personalizado, por favor, selecione a data inicial e final.');
            return;
        }
        
        setIsLoading(true);
        setReport(null);
        setReportData(null);
        setError(null);

        try {
            const params: { [key: string]: string | number } = {
                hostids: selectedHostId
            };
            let periodDays: number;

            if (reportPeriod === 'custom' && customStartDate && customEndDate) {
                const time_from = Math.floor(new Date(customStartDate + 'T00:00:01Z').getTime() / 1000);
                const time_till = Math.floor(new Date(customEndDate + 'T23:59:59Z').getTime() / 1000);
                periodDays = Math.ceil((time_till - time_from) / (60 * 60 * 24));
                params.time_from = time_from;
                params.time_till = time_till;
            } else {
                periodDays = reportPeriod === '7d' ? 7 : 30;
                params.period = `${periodDays}d`;
            }

            const apiPeriodParams = new URLSearchParams(params as any).toString();
            const time_from_for_data = reportPeriod === 'custom' ? params.time_from as number : Math.floor(Date.now() / 1000) - (periodDays * 24 * 60 * 60);
            const time_till_for_data = reportPeriod === 'custom' ? params.time_till as number : Math.floor(Date.now() / 1000);

            // Buscar dados históricos para análise de performance
            const [historyResponse, eventsResponse, triggersResponse] = await Promise.all([
                fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/zabbix/alerts/history/${selectedCompanyId}?${apiPeriodParams}`),
                fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/zabbix/events/log/${selectedCompanyId}?${apiPeriodParams}`),
                fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/zabbix/triggers/host/${selectedCompanyId}/${selectedHostId}`)
            ]);

            if (!historyResponse.ok || !eventsResponse.ok || !triggersResponse.ok) {
                throw new Error('Falha ao obter dados históricos para o relatório.');
            }

            const alertHistory = await historyResponse.json();
            const eventLog = await eventsResponse.json();
            const hostTriggers = await triggersResponse.json();

            const performanceData = {
                host_info: { name: selectedHost?.name, company: selectedCompany?.nome },
                period: { days: periodDays, start_date: new Date(time_from_for_data * 1000).toISOString(), end_date: new Date(time_till_for_data * 1000).toISOString() },
                alert_history: alertHistory,
                event_log: eventLog,
                host_triggers: hostTriggers,
                report_type: reportType,
                analysis_focus: getReportTypeDescription()
            };

            const reportPrompt = `
                **TAREFA:** Gerar um relatório de ${reportType.toUpperCase()} profissional, limpo e técnico.
                **CONTEXTO DOS DADOS:**
                ${JSON.stringify(performanceData, null, 2)}
                **FOCO OBRIGATÓRIO:** Toda a sua análise, incluindo resumo, tendências e problemas, deve ser focada **exclusivamente** no host especificado em \`performanceData.host_info.name\`. Ignore dados ou eventos de outros hosts, mesmo que estejam presentes no contexto.
                **INSTRUÇÕES GERAIS:**
                - **Formato:** Use Markdown limpo. Comece o relatório diretamente com o "Resumo Executivo" como um cabeçalho de nível 2 (##).
                - **Estilo de Escrita:** Seja objetivo, técnico e claro. **NÃO USE EMOJIS.**
                - **Análise de Eventos:** Ao analisar os dados de 'event_log' e 'alert_history', extraia e mencione explicitamente os **horários exatos (timestamps)** dos eventos mais importantes para facilitar a correlação e a investigação.
                **ESTRUTURA OBRIGATÓRIA DO RELATÓRIO:**
                1.  **Resumo Executivo** (status geral)
                2.  **Análise de Tendências** (padrões identificados)
                3.  **Principais Problemas Identificados** (Apresente como uma tabela Markdown GFM. Para cada problema, inclua uma coluna 'Exemplos de Ocorrência (Data/Hora)' listando os timestamps dos eventos mais relevantes.)
                4.  **Recomendações Específicas** (ações práticas e priorizadas)
                5.  **Aviso de Responsabilidade** (sobre dados e contato)
                **FOCO POR TIPO DE RELATÓRIO:**
                   ${reportType === 'performance' ? `- **Performance:** Foque em otimização, gargalos, eficiência e análise de uso de CPU, Memória, Disco e Rede.\n- **Recomendações:** Ações específicas para melhoria de performance.`
                   : reportType === 'capacity' ? `- **Capacidade:** Foque em crescimento, planejamento de recursos e projeções de uso.\n- **Recomendações:** Ações para planejamento de capacidade e upgrades.`
                   : reportType === 'incidents' ? `- **Incidentes:** Foque na análise de problemas, tempo de resolução, frequência e impacto.\n- **Recomendações:** Ações para melhorias em processos e monitoramento.`
                   : `- **Executivo:** Foque em visão estratégica, ROI, riscos e status geral.\n- **Recomendações:** Ações para suporte a decisões estratégicas e investimentos.`}
                **REGRAS ADICIONAIS:**
                - **Tom:** Escreva como um ${reportType === 'executive' ? 'consultor sênior' : 'SRE/Analista experiente'}.
                - **Linguagem:** Use linguagem ${reportType === 'executive' ? 'estratégica e de negócios' : 'técnica mas acessível'}.
                - **Análise:** Use APENAS os dados fornecidos. Identifique padrões e correlações. Priorize por impacto.
                - **Recomendações:** Seja específico e prático. Priorize por criticidade.
                - **Dados Ausentes:** Se algum dado estiver ausente, mencione claramente no relatório.
            `;
            
            const chatResponse = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: reportPrompt, empresa_id: parseInt(selectedCompanyId) }),
            });

            if (!chatResponse.ok) throw new Error('A resposta do serviço de IA foi inválida.');
            
            const result = await chatResponse.json();
            setReport(result.response);

            const structuredData: ReportData = {
                period: `${periodDays} dias`,
                host_name: selectedHost?.name || 'N/A',
                company_name: selectedCompany?.nome || 'N/A',
                total_events: eventLog.length,
                critical_events: alertHistory.filter((a: any) => a.priority === 'High').length,
                warning_events: alertHistory.filter((a: any) => a.priority === 'Average').length,
                avg_resolution_time: 'N/A',
                top_problems: alertHistory.slice(0, 5).map((a: any) => ({ description: a.description, frequency: 1 })),
                resource_trends: { cpu_avg: 'N/A', memory_avg: 'N/A', disk_avg: 'N/A', trend_direction: 'stable' },
                recommendations: [],
                generated_at: new Date().toISOString()
            };
            setReportData(structuredData);

        } catch (err: any) {
            setError(err.message || "Falha ao se conectar com o serviço. Tente novamente.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadReport = () => {
        if (!report) return;

        const reportHtml = marked(report);
        
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Relatório de ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} - ${selectedHost?.name}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
                    h1, h2, h3 { color: #1a202c; }
                    h1 { font-size: 2em; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
                    h2 { font-size: 1.5em; margin-top: 30px; }
                    h3 { font-size: 1.2em; }
                    table { border-collapse: collapse; width: 100%; margin: 25px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24); }
                    th, td { border: 1px solid #cbd5e0; padding: 12px; text-align: left; }
                    th { background-color: #f7fafc; font-weight: 600; }
                    p { margin-bottom: 1em; }
                    .header { background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
                    .footer { margin-top: 50px; padding: 20px; background: #edf2f7; border-radius: 8px; font-size: 0.9em; text-align: center; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Relatório de ${reportType.charAt(0).toUpperCase() + reportType.slice(1)}</h1>
                    <p><strong>Host:</strong> ${selectedHost?.name}</p>
                    <p><strong>Empresa:</strong> ${selectedCompany?.nome}</p>
                    <p><strong>Período:</strong> ${reportData?.period}</p>
                    <p><strong>Data de Geração:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                </div>
                <div class="content">
                    ${reportHtml}
                </div>
                <div class="footer">
                    <p><strong>Aviso Importante:</strong> Este relatório é baseado nos dados coletados do servidor Zabbix. Em caso de divergências, contate o administrador.</p>
                    <p><strong>Gerado por:</strong> InfraSense AI - ${new Date().toLocaleString('pt-BR')}</p>
                </div>
            </body>
            </html>
        `;

        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-${reportType}-${selectedHost?.name}-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    if (!selectedCompanyId) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center bg-white p-8 rounded-lg shadow-md">
                    <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
                    <h2 className="mt-4 text-2xl font-bold text-gray-800">Nenhuma Empresa Selecionada</h2>
                    <p className="mt-2 text-gray-600">Por favor, selecione uma empresa no painel principal para gerar relatórios.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                    <BarChart3 className="text-indigo-600" />
                    Gerador de Relatório
                </h1>
            </div>

            {/* Inventário de Hosts */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Server className="text-indigo-600" />
                    Inventário de Hosts (Empresa Selecionada)
                </h2>
                <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={inventorySearchTerm}
                            onChange={(e) => setInventorySearchTerm(e.target.value)}
                            placeholder="Pesquisar por nome/tag/grupo..."
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={async () => {
                                if (!selectedCompanyId) return;
                                setIsLoading(true);
                                setError(null);
                                try {
                                    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/zabbix/inventory/${selectedCompanyId}`);
                                    if (inventorySearchTerm) url.searchParams.set('filter', inventorySearchTerm);
                                    const resp = await fetchWithAuth(url.toString());
                                    if (!resp.ok) throw new Error('Falha ao buscar inventário');
                                    const data = await resp.json();
                                    setInventoryRows(data);
                                } catch (err: any) {
                                    setError(err.message || 'Erro ao carregar inventário');
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md"
                        >
                            Gerar Inventário
                        </button>
                        <button
                            onClick={() => {
                                if (!inventoryRows || inventoryRows.length === 0) return;
                                const headers = [
                                    'hostid','host','name','status','available','lastaccess','groups','templates','tags','item_count','active_problems'
                                ];
                                const csv = [headers.join(',')].concat(
                                    inventoryRows.map((r: any) => [
                                        r.hostid,
                                        JSON.stringify(r.host ?? ''),
                                        JSON.stringify(r.name ?? ''),
                                        r.status,
                                        r.available,
                                        r.lastaccess,
                                        JSON.stringify((r.groups || []).join(';')),
                                        JSON.stringify((r.templates || []).join(';')),
                                        JSON.stringify((r.tags || []).join(';')),
                                        r.item_count,
                                        r.active_problems,
                                    ].join(','))
                                ).join('\n');
                                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `inventario-hosts-${new Date().toISOString().slice(0,10)}.csv`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                            }}
                            disabled={!inventoryRows || inventoryRows.length === 0}
                            className={`flex items-center gap-2 font-semibold py-2 px-4 rounded-md transition-colors ${
                                !inventoryRows || inventoryRows.length === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                        >
                            <Download className="h-4 w-4" />
                            Baixar CSV
                        </button>
                    </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-left text-sm text-gray-700">
                        <thead className="bg-gray-50 text-gray-900">
                            <tr>
                                <th className="p-2">Host</th>
                                <th className="p-2">Nome</th>
                                <th className="p-2">Status</th>
                                <th className="p-2">Disponibilidade</th>
                                <th className="p-2">IP(s)</th>
                                <th className="p-2">Grupos</th>
                                <th className="p-2">Templates</th>
                                <th className="p-2">Tags</th>
                                <th className="p-2">Itens</th>
                                <th className="p-2">Problemas</th>
                                <th className="p-2">OS</th>
                                <th className="p-2">OS Versão</th>
                                <th className="p-2">Modelo</th>
                                <th className="p-2">Serial</th>
                                <th className="p-2">Vendor</th>
                                <th className="p-2">Localização</th>
                                <th className="p-2">Responsável</th>
                                <th className="p-2">Notas</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventoryRows && inventoryRows.length > 0 ? (
                                inventoryRows
                                    .filter((r: any) => !inventorySearchTerm || (r.name || '').toLowerCase().includes(inventorySearchTerm.toLowerCase()))
                                    .map((r: any) => (
                                        <tr key={r.hostid} className="border-b">
                                            <td className="p-2">{r.host}</td>
                                            <td className="p-2">{r.name}</td>
                                            <td className="p-2">{Number(r.status) === 0 ? 'Enabled' : 'Disabled'}</td>
                                            <td className="p-2">{Number(r.available) === 1 ? 'Available' : Number(r.available) === 2 ? 'Unavailable' : 'Unknown'}</td>
                                            <td className="p-2">{(r.interfaces || []).map((i: any) => i.ip).filter(Boolean).join(', ')}</td>
                                            <td className="p-2">{(r.groups || []).join('; ')}</td>
                                            <td className="p-2">{(r.templates || []).join('; ')}</td>
                                            <td className="p-2">{(r.tags || []).join('; ')}</td>
                                            <td className="p-2">{r.item_count}</td>
                                            <td className="p-2">{r.active_problems}</td>
                                            <td className="p-2">{r.inventory?.os || r.inventory?.os_full || r.inventory?.os_short || ''}</td>
                                            <td className="p-2">{r.inventory?.os_version || ''}</td>
                                            <td className="p-2">{r.inventory?.model || r.inventory?.hw_model || ''}</td>
                                            <td className="p-2">{r.inventory?.serialno || r.inventory?.hw_serialno || ''}</td>
                                            <td className="p-2">{r.inventory?.vendor || ''}</td>
                                            <td className="p-2">{r.inventory?.location || ''}</td>
                                            <td className="p-2">{r.inventory?.contact || ''}</td>
                                            <td className="p-2">{r.inventory?.notes || ''}</td>
                                        </tr>
                                    ))
                            ) : (
                                <tr>
                                    <td className="p-2 text-gray-500" colSpan={18}>Nenhum dado. Clique em "Gerar Inventário".</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Settings className="text-indigo-600" />
                    Parâmetro do Relatório
                </h2>
                <form onSubmit={handleGenerateReport} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="servidor" className="block text-sm font-medium text-gray-700 mb-1">Servidor / Host</label>
                            <div className="relative host-search-container">
                                <input
                                    ref={reportHostInputRef}
                                    id="servidor"
                                    type="text"
                                    value={reportHostSearchTerm}
                                    onChange={(e) => handleHostSearchChange(e.target.value)}
                                    onFocus={() => setShowHostDropdown(true)}
                                    placeholder={isLoadingHosts ? "Carregando..." : "Digite o nome do servidor..."}
                                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                    disabled={isLoadingHosts}
                                />
                                {selectedHostId && (
                                    <button
                                        onClick={handleClearReportHostSelection}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                                        aria-label="Limpar seleção"
                                    >
                                        <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    </button>
                                )}
                                {showHostDropdown && filteredHosts.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                        {filteredHosts.map(host => (
                                            <div key={host.hostid} onClick={() => handleHostSelect(host.hostid, host.name)} className="p-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-900">
                                                {host.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {showHostDropdown && filteredHosts.length === 0 && reportHostSearchTerm && (
                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-2 text-sm text-gray-500">
                                        Nenhum servidor encontrado
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="report-type" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Relatório</label>
                            <select id="report-type" value={reportType} onChange={(e) => setReportType(e.target.value as any)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900">
                                <option value="performance">Performance</option>
                                <option value="capacity">Capacidade</option>
                                <option value="incidents">Incidentes</option>
                                <option value="executive">Executivo</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-1">{getReportTypeDescription()}</p>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Período de Análise</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-center space-x-2">
                                <input type="radio" id="period-7d" name="period" value="7d" checked={reportPeriod === '7d'} onChange={(e) => setReportPeriod(e.target.value as any)} className="text-indigo-600" />
                                <label htmlFor="period-7d" className="text-sm text-gray-700">Últimos 7 dias</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input type="radio" id="period-30d" name="period" value="30d" checked={reportPeriod === '30d'} onChange={(e) => setReportPeriod(e.target.value as any)} className="text-indigo-600" />
                                <label htmlFor="period-30d" className="text-sm text-gray-700">Últimos 30 dias</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input type="radio" id="period-custom" name="period" value="custom" checked={reportPeriod === 'custom'} onChange={(e) => setReportPeriod(e.target.value as any)} className="text-indigo-600" />
                                <label htmlFor="period-custom" className="text-sm text-gray-700">Período personalizado</label>
                            </div>
                        </div>
                        
                        {reportPeriod === 'custom' && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                                    <input id="start-date" type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" />
                                </div>
                                <div>
                                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                                    <input id="end-date" type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" disabled={isLoading || !selectedHostId} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md transition-colors disabled:bg-indigo-300 flex items-center gap-2">
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            <TrendingUp className="h-4 w-4" />
                            {isLoading ? 'Gerando Relatório...' : 'Gerar Relatório'}
                        </button>
                    </div>
                </form>
            </div>

            {reportData && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow-md text-center">
                        <Activity className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Total de Eventos</p>
                        <p className="text-2xl font-bold text-gray-900">{reportData.total_events}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md text-center">
                        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Eventos Críticos</p>
                        <p className="text-2xl font-bold text-gray-900">{reportData.critical_events}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md text-center">
                        <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Eventos de Aviso</p>
                        <p className="text-2xl font-bold text-gray-900">{reportData.warning_events}</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-md text-center">
                        <Clock className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Período Analisado</p>
                        <p className="text-lg font-bold text-gray-900">{reportData.period}</p>
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="text-indigo-600" />
                        Resultado do Relatório
                    </h2>
                    {report && (
                        <div className="flex items-center gap-3">
                            <button onClick={handleDownloadReport} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                <Download className="h-4 w-4" />
                                Baixar Relatório
                            </button>
                             <button
                                onClick={handleClearReport}
                                className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 hover:text-gray-800 transition-colors"
                                aria-label="Fechar relatório"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>
                <div className="min-h-[400px] p-4 border-2 border-dashed border-gray-200 rounded-md flex items-center justify-center">
                    {isLoading && (
                        <div className="text-center text-gray-500">
                            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2" />
                            <p className="font-semibold">Analisando dados históricos e gerando relatório...</p>
                            <p className="text-sm mt-2">A IA está processando informações do período selecionado e criando um relatório especializado.</p>
                        </div>
                    )}
                    {error && (
                        <div className="text-center text-red-600">
                            <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                            <p className="font-semibold">Ocorreu um erro</p>
                            <p className="text-sm mt-2">{error}</p>
                        </div>
                    )}
                    {!isLoading && !error && !report && (
                         <div className="text-center text-gray-400">
                            <FileText className="mx-auto h-12 w-12 mb-2" />
                            <p className="font-semibold">Relatório não gerado</p>
                            <p className="text-sm mt-2">Selecione um servidor e configure o período para gerar um relatório de performance.</p>
                        </div>
                    )}
                    {report && (
                        <div className="w-full">
                            <div className="prose prose-indigo max-w-none text-gray-800">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {report && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                    <div className="flex">
                        <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-semibold text-yellow-800">Aviso Importante</h3>
                            <p className="text-sm text-yellow-700 mt-1">
                                Este relatório é baseado nos dados coletados do servidor Zabbix. Em caso de divergências ou informações ausentes, 
                                entre em contato com o administrador responsável pela configuração de itens e triggers. 
                                O administrador pode fornecer orientações sobre como configurar monitoramentos adicionais para obter informações mais precisas.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Relatório sob demanda (IA) */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Bot className="text-indigo-600" />
                    Solicitar Relatório à IA
                </h2>
                <div className="space-y-3">
                    <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Descreva exatamente o relatório desejado (hosts, período, métricas, escopo)."
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 min-h-[100px]"
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={async () => {
                                if (!selectedCompanyId || !aiPrompt.trim()) return;
                                setIsLoading(true);
                                setError(null);
                                try {
                                    // Se não há host selecionado, usar o primeiro host disponível ou permitir consulta geral
                                    let hostId = selectedHostId;
                                    if (!hostId && hosts.length > 0) {
                                        hostId = hosts[0].hostid; // Usar primeiro host como padrão
                                    }
                                    
                                    const resp = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/reports/generate`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            empresa_id: parseInt(selectedCompanyId),
                                            host_id: hostId || '',
                                            user_query: aiPrompt,
                                            period: reportPeriod,
                                        }),
                                    });
                                    if (!resp.ok) {
                                        const data = await resp.json().catch(() => ({}));
                                        throw new Error(data.detail || 'Falha ao gerar relatório com IA');
                                    }
                                    const data = await resp.json();
                                    setReport(data.report_content);
                                } catch (err: any) {
                                    setReport(null);
                                    setError(err.message || 'Erro ao gerar relatório com IA. Verifique o escopo informado.');
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-md"
                        >
                            Gerar com IA
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}