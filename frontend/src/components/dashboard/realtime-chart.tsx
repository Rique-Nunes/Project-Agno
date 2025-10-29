'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { generateChartData } from '@/lib/data';

type RealtimeChartProps = {
  metricName: string;
  unit: string;
  period: '24h' | '7d' | '30d';
};

export function RealtimeChart({ metricName, unit, period }: RealtimeChartProps) {
  const [data, setData] = React.useState(() => generateChartData(period));

  React.useEffect(() => {
    setData(generateChartData(period));
    const interval = setInterval(() => {
      setData(prevData => {
        const newData = [...prevData.slice(1)];
        const lastPoint = prevData[prevData.length - 1];
        
        let newLabel;
        if (period === '24h') {
          newLabel = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
          // For longer periods, we don't add new points in real-time
          // We just refetch the whole data set. This logic simulates that.
          return generateChartData(period);
        }

        newData.push({
          time: newLabel,
          value: Math.max(0, Math.min(100, (lastPoint.value + (Math.random() - 0.5) * 10))),
        });
        return newData;
      });
    }, 5000); // Update every 5 seconds for 24h view

    return () => clearInterval(interval);
  }, [period]);

  const chartConfig = {
    value: {
      label: metricName,
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <div className="h-[300px] w-full pt-4">
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 20, left: -10, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={12}
            />
            <YAxis
              tickFormatter={(value) => `${value}${unit}`}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={40}
              fontSize={12}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--accent) / 0.1)', stroke: 'hsl(var(--primary))' }}
              content={<ChartTooltipContent indicator="line" labelKey='time' />}
            />
            <Area
              dataKey="value"
              type="monotone"
              fill="url(#fillValue)"
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
