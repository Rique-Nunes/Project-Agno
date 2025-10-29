'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface HistoryPoint {
  clock: string;
  value: string;
}

interface CpuChartProps {
  data: HistoryPoint[];
  loading: boolean;
}

export default function CpuChart({ data, loading }: CpuChartProps) {
  if (loading) {
    return <div className="text-center p-8">Carregando dados de CPU...</div>;
  }
  
  if (!data || data.length === 0) {
    return <div className="text-center p-8 text-gray-400">Nenhum dado de CPU encontrado para o período.</div>;
  }

  // Formata os dados para o gráfico
  const formattedData = data.map(point => ({
    // Converte o timestamp do Zabbix (segundos) para milissegundos
    time: parseInt(point.clock, 10) * 1000,
    // Converte o valor para número
    usage: parseFloat(point.value),
  }));

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart
          data={formattedData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
          <XAxis
            dataKey="time"
            type="number"
            scale="time"
            domain={['dataMin', 'dataMax']}
            tickFormatter={(unixTime) => format(new Date(unixTime), 'HH:mm')}
            stroke="#A0AEC0"
          />
          <YAxis 
            domain={[0, 100]} 
            label={{ value: 'Uso (%)', angle: -90, position: 'insideLeft', fill: '#A0AEC0' }} 
            stroke="#A0AEC0"
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#2D3748', border: 'none' }}
            labelFormatter={(unixTime) => format(new Date(unixTime), 'dd/MM HH:mm')}
            formatter={(value: number) => [`${value.toFixed(2)}%`, 'Uso de CPU']}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="usage" 
            stroke="#38B2AC" 
            strokeWidth={2} 
            dot={false}
            name="Uso de CPU"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}