'use client';

import { SessionProvider } from 'next-auth/react';
import React from 'react';

// Este componente wrapper é necessário porque o SessionProvider usa o `useContext`
// do React, que só funciona em Componentes de Cliente ('use client').
// O layout raiz (layout.tsx) é um Componente de Servidor por padrão.

interface Props {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}