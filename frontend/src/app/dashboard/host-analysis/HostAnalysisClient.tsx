'use client';
import { useState, useEffect, useMemo } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';
import useSWR from 'swr';
import fetchWithAuth from '@/lib/fetchwithauth';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Cpu, MemoryStick, HardDrive, Download, Upload, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';

// --- Tipagens para os dados ---
interface Empresa {
  id: number;
  nome: string;
}

interface Host {
  hostid: string;
  name: string;
}

interface KeyMetric {
  key: string;
  value: string;
  partition?: string;
  label?: string;
}

interface SystemInfo {
  host: { name?: string; ip?: string; dns?: string; };
  system: { os?: string; arch?: string; cpu_cores?: string; uptime?: string; };
}

interface TriggerInfo {
  triggerid: string;
  description: string;
}

interface Triggers {
  critical: TriggerInfo[];
  warning: TriggerInfo[];
  info: TriggerInfo[];
  ok: TriggerInfo[];
}

// --- FUNÇÃO FETCHER PARA SWR ---
const fetcher = async (url: string) => {
  const res = await fetchWithAuth(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    const errorInfo = await res.json();
    (error as any).info = errorInfo;
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
};


// --- FUNÇÃO DE FORMATAÇÃO ---
const formatarTrafegoRede = (bps: number): string => {
    if (isNaN(bps) || bps < 0) return 'N/A';
    if (bps < 1000) {
      return `${bps.toFixed(2)} bps`;
    } else if (bps < 1000000) {
      return `${(bps / 1000).toFixed(2)} Kbps`;
    } else if (bps < 1000000000) {
      return `${(bps / 1000000).toFixed(2)} Mbps`;
    } else {
      return `${(bps / 1000000000).toFixed(2)} Gbps`;
    }
};

interface HostAnalysisClientProps {
  initialHosts: Host[];
  initialEmpresas: Empresa[];
}

export default function HostAnalysisClient({ initialHosts, initialEmpresas }: HostAnalysisClientProps) {
  const { selectedCompanyId, setSelectedCompanyId } = useDashboard();
  const [selectedHostId, setSelectedHostId] = useState<string | null>(null);

  const { data: empresas, isLoading: isLoadingEmpresas } = useSWR<Empresa[]>('/empresas', () => Promise.resolve(initialEmpresas));
  const { data: hosts, isLoading: isLoadingHosts } = useSWR<Host[]>(selectedCompanyId ? `/zabbix/hosts/${selectedCompanyId}` : null, fetcher, { refreshInterval: 60000 });
  const { data: dadosMetricasChave } = useSWR<KeyMetric[]>(selectedHostId && selectedCompanyId ? `/zabbix/metrics/key_metrics/${selectedCompanyId}/${selectedHostId}` : null, fetcher, { refreshInterval: 5000 });
  const { data: dadosSistema } = useSWR<SystemInfo>(selectedHostId && selectedCompanyId ? `/zabbix/host/info/${selectedCompanyId}/${selectedHostId}` : null, fetcher, { refreshInterval: 300000 });
  const { data: dadosTriggers } = useSWR<Triggers>(selectedHostId && selectedCompanyId ? `/zabbix/triggers/host/${selectedCompanyId}/${selectedHostId}` : null, fetcher, { refreshInterval: 15000 });

  useEffect(() => {
    if (empresas && empresas.length > 0 && !selectedCompanyId) {
      setSelectedCompanyId(empresas[0].id.toString());
    }
  }, [empresas, selectedCompanyId, setSelectedCompanyId]);

  useEffect(() => {
    setSelectedHostId(null);
  }, [selectedCompanyId]);

  const metricas = useMemo(() => {
    const metricsData: { [key: string]: any } = {};
    if (!dadosMetricasChave) return metricsData;

    dadosMetricasChave.forEach(m => {
        const numValue = parseFloat(m.value);
        if (isNaN(numValue)) return;

        if (m.key.startsWith('disk_')) {
            if (!metricsData.disks) metricsData.disks = [];
            metricsData.disks.push({
                title: m.label || `Espaço Utilizado (${m.partition})`,
                value: `${numValue.toFixed(2)} %`,
            });
        } else if (m.key.startsWith('network_')) {
            metricsData[m.key] = formatarTrafegoRede(numValue);
        } else {
            metricsData[m.key] = `${numValue.toFixed(2)} %`;
        }
    });
    return metricsData;
  }, [dadosMetricasChave]);

  const cardsDeMetricas = useMemo(() => {
    const diskCards = metricas.disks?.map((disk: any) => ({
        ...disk,
        icon: <HardDrive className="h-6 w-6 text-red-400" />,
        color: "text-red-400",
    })) || [];

    return [
        { title: "Uso de CPU", value: metricas.cpu_util || 'N/A', icon: <Cpu className="h-6 w-6 text-blue-400" />, color: "text-blue-400" },
        { title: "Uso de Memória", value: metricas.memory_pused || 'N/A', icon: <MemoryStick className="h-6 w-6 text-yellow-400" />, color: "text-yellow-400" },
        ...diskCards,
        { title: "Tráfego de Rede (Entrada)", value: metricas.network_in || 'N/A', icon: <Download className="h-6 w-6 text-green-400" />, color: "text-green-400" },
        { title: "Tráfego de Rede (Saída)", value: metricas.network_out || 'N/A', icon: <Upload className="h-6 w-6 text-purple-400" />, color: "text-purple-400" }
    ];
  }, [metricas]);
  
  const renderTriggers = (triggers: TriggerInfo[], title: string, Icon: React.ElementType, color: string) => {
    if (!triggers || triggers.length === 0) return null;
    return (
      <div className="mt-4">
        <h3 className={`text-lg font-semibold mb-2 flex items-center ${color}`}>
          <Icon className="h-5 w-5 mr-2" /> {title} ({triggers.length})
        </h3>
        <ul className="space-y-1 text-sm list-disc list-inside">
          {triggers.map((t: TriggerInfo) => <li key={t.triggerid}>{t.description}</li>)}
        </ul>
      </div>
    );
  };

  if (isLoadingHosts || isLoadingEmpresas || !selectedCompanyId) {
    return <div className="flex justify-center items-center h-full"><p>Carregando dados iniciais...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 shadow-md rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Selecione um Host para Análise</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedCompanyId || ''} onValueChange={id => setSelectedCompanyId(id)}>
                <SelectTrigger>
                    <SelectValue placeholder="Selecione uma Empresa" />
                </SelectTrigger>
                <SelectContent>
                    {empresas?.map((empresa: Empresa) => <SelectItem key={empresa.id} value={empresa.id.toString()}>{empresa.nome}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={selectedHostId || ''} onValueChange={id => setSelectedHostId(id)} disabled={!hosts || hosts.length === 0}>
                <SelectTrigger>
                    <SelectValue placeholder={!hosts ? "Carregando hosts..." : "Selecione um Host"} />
                </SelectTrigger>
                <SelectContent>
                    {hosts?.map((host: Host) => <SelectItem key={host.hostid} value={host.hostid}>{host.name}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
      </div>

      {selectedHostId && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cardsDeMetricas.map((metrica, idx) => (
              <div key={idx} className="bg-gray-800 shadow-md rounded-lg p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-400">{metrica.title}</p>
                  {metrica.icon}
                </div>
                <p className={`text-3xl font-bold ${metrica.color}`}>{metrica.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-800 shadow-md rounded-lg p-4">
              <h2 className="text-xl font-bold mb-4 flex items-center"><Info className="mr-2"/> Informações do Sistema</h2>
              {dadosSistema ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-gray-400">Host</h3>
                    <p><strong>Nome:</strong> {dadosSistema.host?.name}</p>
                    <p><strong>IP:</strong> {dadosSistema.host?.ip}</p>
                    <p><strong>DNS:</strong> {dadosSistema.host?.dns}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-400">Sistema</h3>
                    <p><strong>SO:</strong> {dadosSistema.system?.os}</p>
                    <p><strong>Arquitetura:</strong> {dadosSistema.system?.arch}</p>
                    <p><strong>Núcleos de CPU:</strong> {dadosSistema.system?.cpu_cores}</p>
                    <p><strong>Uptime:</strong> {dadosSistema.system?.uptime}</p>
                  </div>
                </div>
              ) : <p>Carregando informações do sistema...</p>}
            </div>

            <div className="bg-gray-800 shadow-md rounded-lg p-4">
              <h2 className="text-xl font-bold mb-4">Status dos Triggers</h2>
              {dadosTriggers ? (
                <>
                  {renderTriggers(dadosTriggers.critical, "Críticos", AlertTriangle, "text-red-500")}
                  {renderTriggers(dadosTriggers.warning, "Avisos", AlertTriangle, "text-yellow-500")}
                  {renderTriggers(dadosTriggers.info, "Informativos", Info, "text-blue-500")}
                  {renderTriggers(dadosTriggers.ok, "OK", CheckCircle2, "text-green-500")}
                </>
              ) : <p>Carregando status dos triggers...</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
