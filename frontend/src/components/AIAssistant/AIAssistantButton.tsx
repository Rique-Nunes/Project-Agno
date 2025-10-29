'use client';

import { MessageSquare } from 'lucide-react';
import { useAI } from '@/contexts/AIContext';
import { useDashboard } from '@/contexts/DashboardContext';

export default function AIAssistantButton() {
    const { toggle } = useAI();
    const { selectedCompanyId } = useDashboard();

    // O botão só funciona se uma empresa estiver selecionada.
    const isDisabled = !selectedCompanyId;

    return (
        <button
            onClick={toggle}
            disabled={isDisabled}
            className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
            title={isDisabled ? "Selecione uma empresa para usar a IA" : "Abrir assistente de IA"}
        >
            <MessageSquare size={24} />
        </button>
    );
}