'use client';
import { useState, useMemo } from 'react';
import { Bot, ChevronDown, Clock, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import fetchWithAuth from '@/lib/fetchwithauth';

// --- SUB-COMPONENTE PARA CADA ITEM DE ALERTA ---
const AlertItem = ({ alert, selectedCompanyId }: { alert: Alert; selectedCompanyId: string }) => {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const severity = priorityMap[alert.priority] || priorityMap['0'];
  const hostName = alert.hosts?.[0]?.name || 'Host desconhecido';

  const handleAiAnalysis = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAiLoading) return;

    setIsAiLoading(true);
    setAiResponse(null);
    if (!isExpanded) setIsExpanded(true);

    const prompt = `Como analista SRE, analise o seguinte alerta:\n- Host: ${hostName}\n- Alerta: ${alert.description}\n- Severidade: ${severity.text}\nForneça possíveis causas e um plano de ação.`;

    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/chat/`, {
        method: 'POST',
        body: JSON.stringify({ question: prompt, empresa_id: parseInt(selectedCompanyId) }),
      });
      if (!response.ok) {
        let errorBody;
        try { errorBody = await response.json(); } 
        catch (jsonError) { errorBody = await response.text(); }
        const errorMessage = typeof errorBody === 'object' ? errorBody.detail : errorBody;
        throw new Error(`Erro ${response.status}: ${errorMessage || 'Falha na resposta da API.'}`);
      }
      const data = await response.json();
      setAiResponse(data.response);
    } catch (err: any) {
      setAiResponse(`**Erro ao buscar análise:**\n\n${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className={`border-l-4 p-4 rounded-md shadow-sm ${severity.border} ${severity.classes}`}>
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex-grow overflow-hidden">
          <p className="font-bold text-sm text-gray-900">{hostName}</p>
          <p className="text-sm text-gray-700 truncate">{alert.description}</p>
          <p className="text-xs text-gray-500 mt-1 flex items-center">
            <Clock size={12} className="mr-1.5" />
            {new Date(parseInt(alert.lastchange) * 1000).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
          <button onClick={handleAiAnalysis} disabled={isAiLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full transition-colors disabled:bg-indigo-300" title="Analisar com IA">
            {isAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
          </button>
          <ChevronDown className={`w-5 h-5 text-gray-600 transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-300/50 prose prose-sm max-w-none text-gray-700">
          {isAiLoading && <p className="animate-pulse">Analisando com IA...</p>}
          
          {aiResponse ? (
            <ReactMarkdown>{aiResponse}</ReactMarkdown>
          ) : (
            !isAiLoading && <p className="text-xs">Clique no ícone da IA para uma análise detalhada.</p>
          )}
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
interface Alert { triggerid: string; description: string; priority: string; hosts: { name: string }[]; lastchange: string; }
interface AlertHistoryProps { alerts: Alert[]; selectedCompanyId: string; isLoading: boolean; }
const priorityMap: { [key: string]: { text: string; classes: string; border: string; btn: string; } } = {
  '5': { text: 'Desastre', classes: 'bg-purple-50', border: 'border-purple-500', btn: 'bg-purple-600 text-white' },
  '4': { text: 'Alta', classes: 'bg-red-50', border: 'border-red-500', btn: 'bg-red-600 text-white' },
  '3': { text: 'Média', classes: 'bg-orange-50', border: 'border-orange-500', btn: 'bg-orange-500 text-white' },
  '2': { text: 'Aviso', classes: 'bg-yellow-50', border: 'border-yellow-500', btn: 'bg-yellow-400 text-gray-800' },
  '1': { text: 'Info', classes: 'bg-blue-50', border: 'border-blue-500', btn: 'bg-blue-500 text-white' },
  '0': { text: 'Não classificado', classes: 'bg-gray-100', border: 'border-gray-400', btn: 'bg-gray-500 text-white' },
};

export default function AlertHistoryInteractive({ alerts, selectedCompanyId, isLoading }: AlertHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activePriorities, setActivePriorities] = useState<string[]>(['0', '1', '2', '3', '4', '5']);

  const filteredAlerts = useMemo(() => {
    console.log("--- RECALCULANDO FILTRO ---");
    console.log("Prioridades ativas:", activePriorities);
    
    return (alerts || []).filter((alert, index) => {
      const alertPriority = alert.priority;
      const priorityAsString = String(alertPriority);
      const matchesPriority = activePriorities.includes(priorityAsString);
      
      // --- SUPER DEBUG ---
      console.log(`[Alerta ${index}] -> Prioridade: ${alertPriority} (tipo: ${typeof alertPriority}) | Convertido para string: "${priorityAsString}" | Passou no filtro de prioridade? ${matchesPriority}`);

      return matchesPriority; // Por enquanto, vamos ignorar o filtro de texto
    });
  }, [alerts, searchTerm, activePriorities]);
  
  const toggleSeverityFilter = (priority: string) => {
    setActivePriorities(prev => prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]);
  };

  const priorityButtons = ['5', '4', '3', '2', '1', '0'];

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Histórico Interativo de Alertas</h2>
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <input type="text" placeholder="Filtrar por host ou descrição..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-gray-900 focus:ring-indigo-500 focus:border-indigo-500" />
        <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
          {priorityButtons.map(p => {
            const { text, btn } = priorityMap[p];
            return <button key={p} onClick={() => toggleSeverityFilter(p)} className={`px-3 py-1 text-sm font-medium rounded-full transition-opacity ${activePriorities.includes(p) ? btn : 'bg-gray-200 text-gray-700 opacity-60 hover:opacity-100'}`}>{text}</button>;
          })}
        </div>
      </div>
      {isLoading ? (
        <p className="text-center text-gray-500 py-4">Carregando alertas...</p>
      ) : filteredAlerts.length > 0 ? (
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {filteredAlerts.map(alert => <AlertItem key={alert.triggerid} alert={alert} selectedCompanyId={selectedCompanyId} />)}
        </div>
      ) : (
        <p className="text-center text-sm text-gray-500 py-4">Nenhum alerta correspondente aos filtros foi encontrado.</p>
      )}
    </div>
  );
}