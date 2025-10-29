'use client'; 

import { useState } from 'react';
import Siderbar from "@/components/Siderbar";
import Header from '@/components/Header';
import { AIProvider } from '@/contexts/AIContext';
import AIAssistantButton from '@/components/ai/AIAssistantButton';
import AIAssistantWindow from '@/components/ai/AIAssistantWindow';
import { DashboardProvider, useDashboard } from '@/contexts/DashboardContext';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
    const { step } = useDashboard();
    const [isSidebarOpen, setSidebarOpen] = useState(false); // Estado para controlar a sidebar

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Passando o estado e o controle para a Siderbar */}
            <Siderbar isOpen={isSidebarOpen} setIsOpen={setSidebarOpen} />
            
            <div className="flex-1 flex flex-col overflow-hidden max-h-screen">
                {/* Mostra o Header e passa o controle da sidebar para ele */}
                {step === 'viewDashboard' && <Header toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />}
                
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-6 lg:p-8">
                    {children}
                </main>
            </div>
            
            <AIAssistantButton />
            <AIAssistantWindow />
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AIProvider>
            <DashboardProvider>
                <DashboardLayoutContent>{children}</DashboardLayoutContent>
            </DashboardProvider>
        </AIProvider>
    );
}