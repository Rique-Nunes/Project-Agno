"use client";

import { useAI } from "@/contexts/AIContext";
import { useDashboard } from "@/contexts/DashboardContext"; // CORRIGIDO
import fetchWithAuth from "@/lib/fetchwithauth";
import { useEffect, useRef, useState } from "react";
import { Bot, Loader, Send, User, X } from 'lucide-react';
import { useSession } from "next-auth/react";

const ROLE_HIERARCHY = {
  viewer: 1,
  operator: 2,
  admin: 3,
  super_admin: 4,
};
type UserRole = keyof typeof ROLE_HIERARCHY;


export default function AIAssistantWindow() {
    const { isVisible, close, conversation, setConversation } = useAI();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { selectedCompanyId } = useDashboard(); // CORRIGIDO
    const conversationEndRef = useRef<HTMLDivElement>(null);
    
    const { data: session } = useSession();
    const userRole = session?.user?.role as UserRole | undefined;
    const userLevel = userRole ? ROLE_HIERARCHY[userRole] : 0;
    const canUseAI = userLevel >= ROLE_HIERARCHY.operator;

    const scrollToBottom = () => {
        conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [conversation]);

    const handleSendMessage = async (e?: React.FormEvent, question?: string) => {
        if (e) e.preventDefault();
        
        if (!canUseAI) {
            setConversation([...conversation, { role: 'bot', content: "Você não tem permissão para usar o assistente de IA." }]);
            return;
        }

        let userMessage = question || input;
        if (!userMessage.trim() || !selectedCompanyId) return;

        const newConversation = [...conversation, { role: 'user', content: userMessage }];
        setConversation(newConversation);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
                method: 'POST',
                body: JSON.stringify({
                    question: userMessage,
                    empresa_id: parseInt(selectedCompanyId),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Erro na API');
            }

            const data = await response.json();
            setConversation([...newConversation, { role: 'bot', content: data.response }]);
        } catch (error: any) {
            setConversation([...newConversation, { role: 'bot', content: `Desculpe, ocorreu um erro: ${error.message}` }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isVisible) return null;

    return (
        <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-gray-800 border border-gray-700 rounded-lg shadow-xl flex flex-col z-50">
            <header className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Assistente IA</h2>
                <button onClick={close} className="text-gray-400 hover:text-white">
                    <X size={20} />
                </button>
            </header>

            <div className="flex-1 p-4 overflow-y-auto">
                <div className="flex flex-col space-y-4">
                    {conversation.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'bot' && (
                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                    <Bot size={20} className="text-white" />
                                </div>
                            )}
                            <div className={`px-4 py-2 rounded-lg max-w-xs ${msg.role === 'user' ? 'bg-gray-700 text-white self-end' : 'bg-gray-700 text-gray-300'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                                    <User size={20} className="text-white" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                                <Bot size={20} className="text-white" />
                            </div>
                            <div className="px-4 py-2 rounded-lg max-w-xs bg-gray-700 text-gray-300 flex items-center">
                                <Loader size={20} className="animate-spin text-white" />
                            </div>
                        </div>
                    )}
                    <div ref={conversationEndRef} />
                </div>
            </div>

            <footer className="p-4 border-t border-gray-700">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={canUseAI ? "Pergunte algo..." : "Permissão necessária"}
                        disabled={isLoading || !canUseAI}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim() || !canUseAI}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </form>
            </footer>
        </div>
    );
}