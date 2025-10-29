'use client';

import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface EventLogEntry {
  eventid: string;
  time: string;
  description: string;
  priority: string;
  host: string;
  status: 'PROBLEMA' | 'RESOLVIDO';
}

interface EventLogProps {
  logEntries: EventLogEntry[];
  isLoading: boolean;
}

const getPriorityStyles = (priority: string) => {
  switch (priority) {
    case '5': return 'bg-purple-500'; // Disaster
    case '4': return 'bg-red-500';     // High
    case '3': return 'bg-orange-500';  // Average
    case '2': return 'bg-yellow-500';  // Warning
    default: return 'bg-blue-500';     // Info
  }
};

export default function EventLog({ logEntries, isLoading }: EventLogProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="space-y-4">
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
          <div className="h-10 bg-gray-200 rounded w-4/5"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Linha do Tempo de Eventos</h2>
      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
        {logEntries && logEntries.length > 0 ? (
          logEntries.map((entry) => (
            <div key={entry.eventid} className="flex items-start space-x-4">
              {/* Ícone e Linha do Tempo */}
              <div className="flex flex-col items-center">
                <span
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white ${
                    entry.status === 'PROBLEMA' ? 'bg-red-500' : 'bg-green-500'
                  }`}
                >
                  {entry.status === 'PROBLEMA' ? (
                    <AlertTriangle size={16} />
                  ) : (
                    <CheckCircle2 size={16} />
                  )}
                </span>
              </div>

              {/* Conteúdo do Evento */}
              <div className="flex-grow">
                <div className="flex justify-between items-center">
                    <p className="font-semibold text-gray-800">
                        {entry.host}: <span className="font-normal">{entry.description}</span>
                    </p>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full text-white ${getPriorityStyles(entry.priority)}`}>
                        {entry.status}
                    </span>
                </div>
                <div className="text-xs text-gray-500 flex items-center mt-1">
                  <Clock size={12} className="mr-1.5" />
                  {entry.time}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            Nenhum evento registrado no período selecionado.
          </p>
        )}
      </div>
    </div>
  );
}