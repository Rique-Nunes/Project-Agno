'use client';

import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchHosts } from '@/services/api';

type Host = {
  hostid: string;
  name: string;
};

type HostSelectorProps = {
  selectedHost: string;
  onHostChange: (hostName: string) => void;
};

export function HostSelector({ selectedHost, onHostChange }: HostSelectorProps) {
  const [hosts, setHosts] = useState<Host[]>([]);

  useEffect(() => {
    const loadHosts = async () => {
      const hostData = await fetchHosts();
      // Adiciona uma opção "Todos" no início da lista, se necessário
      // setHosts([{ hostid: 'all', name: 'All Hosts' }, ...hostData]);
      setHosts(hostData);
    };
    loadHosts();
  }, []);

  if (hosts.length === 0) {
    return <div>Loading hosts...</div>;
  }

  return (
    <Select value={selectedHost} onValueChange={onHostChange}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Selecione um host" />
      </SelectTrigger>
      <SelectContent>
        {hosts.map((host) => (
          <SelectItem key={host.hostid} value={host.name}>
            {host.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}