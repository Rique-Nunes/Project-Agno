'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { RealtimeChart } from './realtime-chart';
import { useState } from 'react';

type Period = '24h' | '7d' | '30d';

export function ChartsTabs() {
  const [period, setPeriod] = useState<Period>('24h');

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>System Metrics</CardTitle>
          <CardDescription>
            Real-time performance of key system resources.
          </CardDescription>
        </div>
        <Tabs value={period} onValueChange={(value) => setPeriod(value as Period)} className="space-x-1">
          <TabsList>
            <TabsTrigger value="24h">24h</TabsTrigger>
            <TabsTrigger value="7d">7d</TabsTrigger>
            <TabsTrigger value="30d">30d</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="cpu" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="cpu">CPU</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
            <TabsTrigger value="disk">Disk</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
          </TabsList>
          <TabsContent value="cpu">
            <RealtimeChart metricName="CPU" unit="%" period={period} />
          </TabsContent>
          <TabsContent value="memory">
            <RealtimeChart metricName="Memory" unit="%" period={period} />
          </TabsContent>
          <TabsContent value="disk">
            <RealtimeChart metricName="Disk" unit="%" period={period} />
          </TabsContent>
          <TabsContent value="network">
            <RealtimeChart metricName="Network" unit="Mbps" period={period} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
