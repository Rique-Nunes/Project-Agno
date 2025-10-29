'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ChartProps {
  data: any[];
  setTimeRange: (days: number) => void;
}

const SystemMetricsChart = ({ data, setTimeRange }: ChartProps) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Métricas do Sistema (Uso de CPU)</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setTimeRange(1)}>24h</Button>
          <Button variant="outline" size="sm" onClick={() => setTimeRange(7)}>7d</Button>
          <Button variant="outline" size="sm" onClick={() => setTimeRange(30)}>30d</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 350 }}>
            {data && data.length > 0 ? (
                <ResponsiveContainer>
                    <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} angle={-20} textAnchor="end" height={60} />
                    <YAxis unit="%" />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" name="Uso de CPU" stroke="#8884d8" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                    Carregando dados do gráfico ou sem dados para exibir...
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemMetricsChart;