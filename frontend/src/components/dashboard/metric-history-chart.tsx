'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Loader2 } from 'lucide-react';

interface ChartData {
    time: string;
    cpu: number | null;
    memory: number | null;
}

interface MetricHistoryChartProps {
    data: ChartData[];
    isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
                <p className="font-bold text-gray-800">{`Hora: ${label}`}</p>
                {payload.map((p: any) => (
                    <p key={p.name} style={{ color: p.color }}>
                        {`${p.name}: ${p.value?.toFixed(2)}%`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};


export default function MetricHistoryChart({ data, isLoading }: MetricHistoryChartProps) {
    if (isLoading) {
        return (
            <div className="h-80 flex justify-center items-center bg-white rounded-lg shadow-md">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="h-80 flex justify-center items-center bg-white rounded-lg shadow-md">
                <p className="text-gray-500">Dados de histórico não disponíveis para este período.</p>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Média de Consumo de Recursos (% por Hora)</h2>
            <div className="h-80 w-full">
                <ResponsiveContainer>
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorMemory" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="time" stroke="gray" fontSize={12} />
                        <YAxis stroke="gray" fontSize={12} unit="%" />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area type="monotone" dataKey="cpu" name="CPU" stroke="#8884d8" fillOpacity={1} fill="url(#colorCpu)" />
                        <Area type="monotone" dataKey="memory" name="Memória" stroke="#82ca9d" fillOpacity={1} fill="url(#colorMemory)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}