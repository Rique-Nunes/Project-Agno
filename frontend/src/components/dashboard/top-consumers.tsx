'use client';
import { Loader2, Cpu, MemoryStick } from 'lucide-react';

interface Consumer {
    name: string;
    value: number;
}

interface TopConsumersProps {
    topCpu: Consumer[];
    topMemory: Consumer[];
    isLoading: boolean;
}

const ConsumerList = ({ title, data, icon: Icon }: { title: string, data: Consumer[], icon: React.ElementType }) => (
    <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Icon className="h-6 w-6 text-indigo-600" />
            {title}
        </h3>
        <ul className="space-y-2">
            {data && data.length > 0 ? (
                data.map((item, index) => (
                    <li key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                        <span className="text-sm font-medium text-gray-800">{item.name}</span>
                        <span className="text-sm font-bold text-gray-900 bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                            {item.value.toFixed(2)}%
                        </span>
                    </li>
                ))
            ) : (
                <p className="text-sm text-gray-500">Nenhum dado de consumo expressivo no momento.</p>
            )}
        </ul>
    </div>
);


export default function TopConsumers({ topCpu, topMemory, isLoading }: TopConsumersProps) {
    if (isLoading) {
        return (
            <div className="h-64 flex justify-center items-center bg-white rounded-lg shadow-md">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Maiores Consumidores de Recursos (Tempo Real)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                <ConsumerList title="Top 5 - Consumo de CPU" data={topCpu} icon={Cpu} />
                <ConsumerList title="Top 5 - Consumo de Memória" data={topMemory} icon={MemoryStick} />
            </div>
        </div>
    );
}