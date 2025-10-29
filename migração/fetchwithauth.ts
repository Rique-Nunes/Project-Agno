import { getSession } from 'next-auth/react';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const session = await getSession();
  
  // Em NextAuth v4, o JWT completo está em 'accessToken' após o callback
  const token = (session as any)?.accessToken; 

  if (!token) {
    // Se não houver token, rejeitamos a promessa para que o .catch() no componente funcione
    return Promise.reject(new Error("Token não encontrado. Faça login."));
  }

  const headers = {
    ...options.headers,
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  return fetch(url, { ...options, headers });
}

export default fetchWithAuth; // <-- Use export default