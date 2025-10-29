'use client';
import React, { useState, useEffect } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { fetchActiveTriggers } from '@/services/api';

const severityMap: { [key: string]: { text: string; variant: any } } = {
  '5': { text: 'Desastre', variant: 'destructive' }, '4': { text: 'Alta', variant: 'destructive' },
  '3': { text: 'Média', variant: 'secondary' }, '2': { text: 'Aviso', variant: 'default' },
  '1': { text: 'Informação', variant: 'outline' }, '0': { text: 'Não classificada', variant: 'outline' },
};

export function AlertsTable({ selectedHost }: { selectedHost: string }) {
  const [triggers, setTriggers] = useState<any[]>([]);

  useEffect(() => {
    const getTriggers = async () => {
      // REAPLICANDO: Envia o nome do host para a API
      const data = await fetchActiveTriggers(selectedHost);
      setTriggers(data || []);
    };
    getTriggers();
  }, [selectedHost]); // REAPLICANDO: Refaz a busca quando o host muda

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
       <div className="p-6"><h3 className="text-2xl font-semibold">Alertas Recentes</h3></div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Severidade</TableHead>
            <TableHead>Host</TableHead>
            <TableHead>Descrição</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {triggers.length > 0 ? triggers.map((trigger) => (
            <TableRow key={trigger.triggerid}>
              <TableCell><Badge variant={severityMap[trigger.priority]?.variant || 'outline'}>{severityMap[trigger.priority]?.text || 'N/A'}</Badge></TableCell>
              <TableCell>{trigger.hosts[0]?.name || 'N/A'}</TableCell>
              <TableCell>{trigger.description}</TableCell>
            </TableRow>
          )) : (<TableRow><TableCell colSpan={3} className="text-center">Nenhum alerta ativo para o host selecionado.</TableCell></TableRow>)}
        </TableBody>
      </Table>
    </div>
  );
}