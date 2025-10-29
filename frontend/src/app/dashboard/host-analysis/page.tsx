'use client';

import { useState, useEffect } from 'react';
import { useDashboard } from '@/contexts/DashboardContext';
import fetchWithAuth from '@/lib/fetchwithauth';
import { Cpu, HardDrive, MemoryStick, Activity, AlertCircle, Server, Upload, Download } from 'lucide-react';
import HostAlerts from '@/components/dashboard/host-alerts';
import HostSystemInfo from '@/components/dashboard/host-system-info';
import HostAIChat from '@/components/dashboard/host-ai-chat';

// --- FUNÇÃO DE FORMATAÇÃO ADICIONADA AQUI ---
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

interface KeyMetric {
    key: string;
    value: string;
    label?: string;
    partition?: string;
}

const metricLabels: { [key: string]: { label: string; icon: JSX.Element; unit: string } } = {
    cpu_util: { label: 'Uso de CPU', icon: <Cpu className="text-blue-500" />, unit: '%' },
    memory_pused: { label: 'Uso de Memória', icon: <MemoryStick className="text-yellow-500" />, unit: '%' },
    network_in: { label: 'Tráfego de Rede (Entrada)', icon: <Download className="text-green-500" />, unit: 'bps' },
    network_out: { label: 'Tráfego de Rede (Saída)', icon: <Upload className="text-purple-500" />, unit: 'bps' },
};

export default function HostAnalysisPage() {
    const { 
        selectedCompanyId, 
        hosts, 
        isLoadingHosts,
        selectedHostId,
        setSelectedHostId
    } = useDashboard();
    
    const [metrics, setMetrics] = useState<KeyMetric[]>([]);
    const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoadingHosts && hosts.length > 0 && !selectedHostId) {
            setSelectedHostId(hosts[0].hostid);
        }
    }, [isLoadingHosts, hosts, selectedHostId, setSelectedHostId]);

    useEffect(() => {
        if (!selectedHostId) {
            setMetrics([]);
            return;
        }

        const fetchMetrics = async () => {
            setIsLoadingMetrics(true);
            setError(null);
            try {
                const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/zabbix/metrics/key_metrics/${selectedCompanyId}/${selectedHostId}`);
                if (!response.ok) {
                    throw new Error('Falha ao buscar métricas do host.');
                }
                const data: KeyMetric[] = await response.json();
                setMetrics(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoadingMetrics(false);
            }
        };

        fetchMetrics();
        const intervalId = setInterval(fetchMetrics, 30000); // Atualiza a cada 30s
        return () => clearInterval(intervalId);

    }, [selectedCompanyId, selectedHostId]);

    if (!selectedCompanyId) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center bg-white p-8 rounded-lg shadow-md">
                    <AlertCircle className="mx-auto h-12 w-12 text-yellow-500" />
                    <h2 className="mt-4 text-2xl font-bold text-gray-800">Nenhuma Empresa Selecionada</h2>
                    <p className="mt-2 text-gray-600">Por favor, selecione uma empresa no painel principal para analisar os hosts.</p>
                </div>
            </div>
        );
    }
    
    const selectedHost = hosts.find(h => h.hostid === selectedHostId);

    // --- FUNÇÃO DE RENDERIZAÇÃO CORRIGIDA ---
    const renderMetricCard = (metric: KeyMetric) => {
        const isDisk = metric.key.startsWith('disk_');
        let metricInfo;

        if (isDisk) {
            metricInfo = {
                label: metric.label || metric.key,
                icon: <HardDrive className="text-red-500" />,
                unit: '%',
            };
        } else if (metricLabels[metric.key]) {
            metricInfo = metricLabels[metric.key];
        } else {
            metricInfo = {
                label: metric.key,
                icon: <Server />,
                unit: '',
            };
        }

        const renderValue = () => {
            const numValue = parseFloat(metric.value);
            if (isNaN(numValue)) return metric.value;

            if (metric.key === 'network_in' || metric.key === 'network_out') {
                return formatarTrafegoRede(numValue);
            }
            
            return `${numValue.toFixed(2)} ${metricInfo.unit}`;
        };

        return (
            <div key={metric.key} className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
                <div className="flex-shrink-0 bg-gray-100 p-3 rounded-full">
                    {metricInfo.icon}
                </div>
                <div>
                    <p className="text-sm text-gray-500">{metricInfo.label}</p>
                    <p className="text-2xl font-bold text-gray-800">
                        {renderValue()}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Análise de Host</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                <label htmlFor="host-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Selecione um Host para Análise
                </label>
                {isLoadingHosts ? (
                    <p>Carregando hosts...</p>
                ) : (
                    <select
                        id="host-select"
                        value={selectedHostId || ''}
                        onChange={(e) => setSelectedHostId(e.target.value)}
                        className="w-full max-w-sm p-2 border border-gray-300 rounded-md shadow-sm text-gray-900"
                        disabled={hosts.length === 0}
                    >
                        {hosts.length > 0 ? (
                            hosts.map(host => <option key={host.hostid} value={host.hostid}>{host.name}</option>)
                        ) : (
                            <option>Nenhum host encontrado</option>
                        )}
                    </select>
                )}
            </div>

            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">{error}</p>}
            
            {isLoadingMetrics ? (
                <p className="text-center p-4">Carregando métricas...</p>
            ) : selectedHostId && metrics.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {metrics.map(renderMetricCard)}
                </div>
            ) : (
                !isLoadingMetrics && selectedHostId && <p className="text-center text-gray-500">Nenhuma métrica encontrada para este host.</p>
            )}

            {selectedHostId && (
                <>
                    <HostSystemInfo hostId={selectedHostId} empresaId={selectedCompanyId} />
                    <HostAlerts hostId={selectedHostId} empresaId={selectedCompanyId} />
                    {selectedHost && (
                        <HostAIChat 
                            hostId={selectedHostId} 
                            empresaId={selectedCompanyId}
                            hostName={selectedHost.name}
                        />
                    )}
                </>
            )}
        </div>
    );
}