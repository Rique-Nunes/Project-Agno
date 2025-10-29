'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TopHost { name: string; value: number; }
interface TrendPoint {
    time: string;
    cpu: number;
    memory: number;
    top_cpu: TopHost[];
    top_memory: TopHost[];
}

interface HealthChartsProps {
    trendData: TrendPoint[];
    isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 text-sm">
                <p className="font-bold text-gray-800 mb-2">{`Horário: ${label}`}</p>
                {payload.map((p: any) => (
                    <div key={p.dataKey} style={{ color: p.color }}>
                        <p className="font-semibold">{`${p.name}: ${p.value?.toFixed(2) || 0}% (média)`}</p>
                        <div className="pl-4 text-xs text-gray-600">
                            <p className="font-medium">Principais consumidores:</p>
                            <ul>
                                { (p.dataKey === 'cpu' ? data.top_cpu : data.top_memory)?.map((host: TopHost, index: number) => (
                                    <li key={index}>{`${host.name}: ${host.value.toFixed(2)}%`}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function HealthCharts({ trendData, isLoading }: HealthChartsProps) {
    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="h-72 bg-gray-200 rounded w-full"></div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Saúde do Ambiente no Período</h2>
            <div>
                <h3 className="font-semibold text-gray-700 mb-4 text-center">Média de Consumo de Recursos (%)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Line type="monotone" dataKey="cpu" name="CPU" stroke="#8884d8" activeDot={{ r: 8 }} dot={false} />
                        <Line type="monotone" dataKey="memory" name="Memória" stroke="#82ca9d" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}