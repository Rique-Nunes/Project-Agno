'use client';

import { useState, useEffect } from 'react';
import { Server, Cpu, HardDrive, Package, Globe, Clock } from 'lucide-react';
import fetchWithAuth from '@/lib/fetchwithauth';

interface HostSystemInfoProps {
  hostId: string;
  empresaId: string;
}

export default function HostSystemInfo({ hostId, empresaId }: HostSystemInfoProps) {
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      if (!hostId || !empresaId) return;
      
      setIsLoading(true);
      try {
        const response = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/zabbix/host/info/${empresaId}/${hostId}`
        );
        const data = await response.json();
        setSystemInfo(data);
      } catch (err) {
        console.error('Erro ao buscar informações do sistema:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSystemInfo();
  }, [hostId, empresaId]);

  const formatUptime = (seconds: string) => {
    if (!seconds || seconds === 'N/A') return 'N/A';
    try {
      const uptime = parseInt(seconds);
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      
      if (days > 0) {
        return `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes}m`;
      }
    } catch {
      return seconds;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="text-gray-500">Carregando informações do sistema...</p>
      </div>
    );
  }

  if (!systemInfo) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Server className="text-indigo-600" />
        Informações do Sistema
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Informações do Host */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 border-b pb-2">Host</h3>
          
          <div className="flex items-start gap-3">
            <Globe className="text-gray-500 mt-1" size={18} />
            <div>
              <p className="text-xs text-gray-500">Nome</p>
              <p className="text-sm font-semibold text-gray-800">{systemInfo.host?.name || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Globe className="text-gray-500 mt-1" size={18} />
            <div>
              <p className="text-xs text-gray-500">IP</p>
              <p className="text-sm font-semibold text-gray-800">{systemInfo.host?.ip || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Globe className="text-gray-500 mt-1" size={18} />
            <div>
              <p className="text-xs text-gray-500">DNS</p>
              <p className="text-sm font-semibold text-gray-800">{systemInfo.host?.dns || 'N/A'}</p>
            </div>
          </div>

          {systemInfo.host?.description && (
            <div className="flex items-start gap-3">
              <Server className="text-gray-500 mt-1" size={18} />
              <div>
                <p className="text-xs text-gray-500">Descrição</p>
                <p className="text-sm font-semibold text-gray-800">{systemInfo.host.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Informações do Sistema */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-700 border-b pb-2">Sistema</h3>
          
          {systemInfo.system?.os && (
            <div className="flex items-start gap-3">
              <Server className="text-gray-500 mt-1" size={18} />
              <div>
                <p className="text-xs text-gray-500">Sistema Operacional</p>
                <p className="text-sm font-semibold text-gray-800">{systemInfo.system.os}</p>
              </div>
            </div>
          )}

          {systemInfo.system?.arch && (
            <div className="flex items-start gap-3">
              <Server className="text-gray-500 mt-1" size={18} />
              <div>
                <p className="text-xs text-gray-500">Arquitetura</p>
                <p className="text-sm font-semibold text-gray-800">{systemInfo.system.arch}</p>
              </div>
            </div>
          )}

          {systemInfo.system?.cpu_cores && (
            <div className="flex items-start gap-3">
              <Cpu className="text-gray-500 mt-1" size={18} />
              <div>
                <p className="text-xs text-gray-500">Núcleos de CPU</p>
                <p className="text-sm font-semibold text-gray-800">{systemInfo.system.cpu_cores}</p>
              </div>
            </div>
          )}

          {systemInfo.system?.uptime && (
            <div className="flex items-start gap-3">
              <Clock className="text-gray-500 mt-1" size={18} />
              <div>
                <p className="text-xs text-gray-500">Uptime</p>
                <p className="text-sm font-semibold text-gray-800">
                  {formatUptime(systemInfo.system.uptime)}
                </p>
              </div>
            </div>
          )}

          {systemInfo.system?.packages && (
            <div className="flex items-start gap-3">
              <Package className="text-gray-500 mt-1" size={18} />
              <div>
                <p className="text-xs text-gray-500">Pacotes Instalados</p>
                <p className="text-sm font-semibold text-gray-800">{systemInfo.system.packages}</p>
              </div>
            </div>
          )}

          {systemInfo.system?.max_files && (
            <div className="flex items-start gap-3">
              <HardDrive className="text-gray-500 mt-1" size={18} />
              <div>
                <p className="text-xs text-gray-500">Max Open Files</p>
                <p className="text-sm font-semibold text-gray-800">{systemInfo.system.max_files}</p>
              </div>
            </div>
          )}

          {systemInfo.system?.max_processes && (
            <div className="flex items-start gap-3">
              <Cpu className="text-gray-500 mt-1" size={18} />
              <div>
                <p className="text-xs text-gray-500">Max Processos</p>
                <p className="text-sm font-semibold text-gray-800">{systemInfo.system.max_processes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


