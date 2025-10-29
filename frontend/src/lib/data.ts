export const clients = [
  { id: 'all', name: 'All Clients' },
  { id: 'client-a', name: 'Innovate Corp' },
  { id: 'client-b', name: 'Quantum Solutions' },
  { id: 'client-c', name: 'Apex Industries' },
];

export type Alert = {
  id: number;
  severity: 'Critical' | 'High' | 'Warning' | 'Info';
  host: string;
  description: string;
  time: string;
};

export const alerts: Alert[] = [
  { id: 1, severity: 'Critical', host: 'srv-db-01', description: 'Database is down', time: '2m ago' },
  { id: 2, severity: 'High', host: 'srv-web-03', description: 'High CPU utilization (95%)', time: '5m ago' },
  { id: 3, severity: 'Warning', host: 'srv-cache-01', description: 'Memory usage at 85%', time: '12m ago' },
  { id: 4, severity: 'High', host: 'srv-api-02', description: 'API latency over 2s', time: '25m ago' },
  { id: 5, severity: 'Info', host: 'srv-web-01', description: 'Host restarted', time: '1h ago' },
  { id: 6, severity: 'Warning', host: 'srv-db-02', description: 'Disk space running low (15% free)', time: '3h ago' },
];

export const initialMetrics = {
  cpu: 85,
  memory: 72,
  disk: 45,
  network: 230.5,
};

export const generateChartData = (period: '24h' | '7d' | '30d') => {
  let points = 30;
  let interval = 60 * 60 * 1000; // 1 hour for 24h view
  if (period === '7d') {
    points = 42;
    interval = 4 * 60 * 60 * 1000; // 4 hours for 7d view
  } else if (period === '30d') {
    points = 30;
    interval = 24 * 60 * 60 * 1000; // 1 day for 30d view
  }

  const data = [];
  const now = Date.now();
  for (let i = points -1; i >= 0; i--) {
    const timestamp = now - i * interval;
    const date = new Date(timestamp);
    let label = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (period === '7d') {
      label = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:00`;
    } else if (period === '30d') {
      label = `${date.getMonth()+1}/${date.getDate()}`;
    }

    data.push({
      time: label,
      value: Math.floor(Math.random() * (80 - 20 + 1) + 20),
    });
  }
  return data;
};
