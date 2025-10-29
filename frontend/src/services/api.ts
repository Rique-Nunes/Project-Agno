const API_BASE_URL = 'http://34.172.18.44:8000';

export const fetchHosts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/zabbix/hosts`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('An error occurred while fetching hosts:', error);
    return [];
  }
};

export const fetchActiveTriggers = async (hostName?: string) => {
  let url = `${API_BASE_URL}/api/v1/zabbix/triggers`;
  // Adiciona o host_name como query param se ele for fornecido
  if (hostName) {
    url += `?host_name=${encodeURIComponent(hostName)}`;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    return data.result;
  } catch (error) {
    console.error('Error fetching active triggers:', error);
    return [];
  }
};

export const postChatMessage = async (message: string, hostName?: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_question: message,
        host_name: hostName, // Envia o nome do host para a IA
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get response from AI');
    }
    return await response.json();
  } catch (error) {
    console.error('Error posting chat message:', error);
    throw error;
  }
};

export const fetchHostSummary = async (hostName: string) => {
  if (!hostName) return { cpu: 'N/A', memory: 'N/A', disk: 'N/A', network: 'N/A' };
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/zabbix/host-summary/${hostName}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('An error occurred while fetching host summary:', error);
    return { cpu: 'N/A', memory: 'N/A', disk: 'N/A', network: 'N/A' };
  }
};

export const fetchCpuHistory = async (hostName: string, days: number = 1): Promise<any[]> => {
  if (!hostName) return [];
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/zabbix/metrics/cpu/history/${hostName}?days=${days}`);
    if (!response.ok) { console.error('Error fetching CPU history:', response.statusText); return []; }
    const data = await response.json();
    return data.map((point: any) => ({ ...point, date: new Date(point.timestamp * 1000).toLocaleString() }));
  } catch (error) {
    console.error('An error occurred while fetching CPU history:', error);
    return [];
  }
};