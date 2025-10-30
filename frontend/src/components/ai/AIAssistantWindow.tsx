"use client";

import { useAI } from "@/contexts/AIContext";
import fetchWithAuth from "@/lib/fetchwithauth";
import { useEffect, useRef, useState } from "react";
import { Bot, Loader, Send, User, X } from 'lucide-react';

// Supondo que a interface Message esteja definida no contexto AIContext
// Se não, ela precisaria ser definida aqui. Ex:
// type Message = { role: 'user' | 'bot'; content: string; };

export default function AIAssistantWindow() {
    const { isVisible, close, conversation, setConversation } = useAI();
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const conversationEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [conversation]);

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        const userMessage = input.trim();
        if (!userMessage) return;

        const newConversation = [...conversation, { role: 'user' as const, content: userMessage }];
        setConversation(newConversation);
        setInput('');
        setIsLoading(true);

        try {
            // Supondo que este componente não precise do `empresa_id` ou que ele seja obtido de outra forma
            const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
                method: 'POST',
                body: JSON.stringify({
                    question: userMessage,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Erro na API');
            }

            const data = await response.json();
            setConversation([...newConversation, { role: 'bot' as const, content: data.response }]);
        } catch (error: any) {
            setConversation([...newConversation, { role: 'bot' as const, content: `Desculpe, ocorreu um erro: ${error.message}` }]);
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
                        placeholder="Pergunte algo..."
                        disabled={isLoading}
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-white disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                </form>
            </footer>
        </div>
    );
}