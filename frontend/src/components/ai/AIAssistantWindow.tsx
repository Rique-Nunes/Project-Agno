'use client';

import { useAI } from '@/contexts/AIContext';
import { useDashboard } from '@/contexts/DashboardContext';
import fetchWithAuth from '@/lib/fetchwithauth';
import { X, Send, Bot, User, Trash2, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { usePathname } from 'next/navigation';

export default function AIAssistantWindow() {
    const { isVisible, close, conversation, setConversation, clearConversation } = useAI();
    const { selectedCompanyId } = useDashboard(); 
    
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Sugestões de perguntas padrão
    const suggestions = [
        "Qual o status geral do ambiente?",
        "Existem alertas críticos?",
        "Resuma a saúde dos servidores."
    ];

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [conversation, isLoading]);

    const handleSendMessage = async (e?: React.FormEvent, question?: string) => {
        if (e) e.preventDefault();
        const userMessage = question || input;
        if (!userMessage.trim() || !selectedCompanyId) return;

        const newConversation = [...conversation, { role: 'user', content: userMessage }];
        setConversation(newConversation);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/chat/`, {
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
        <div className="fixed bottom-24 right-8 w-96 h-[600px] bg-white rounded-xl shadow-2xl flex flex-col z-50">
            <div className="flex justify-between items-center p-4 border-b">
                <div className='flex items-center space-x-2'>
                    <Bot className="text-indigo-600" />
                    <h2 className="font-bold text-lg text-gray-800">InfraSense AI</h2>
                </div>
                <div className='flex items-center space-x-2'>
                    <button onClick={clearConversation} className="text-gray-500 hover:text-gray-800" title="Nova conversa">
                        <Trash2 size={20} />
                    </button>
                    <button onClick={close} className="text-gray-500 hover:text-gray-800" title="Fechar">
                        <X size={24} />
                    </button>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                <div className="space-y-4">
                    {/* LÓGICA PARA MOSTRAR SUGESTÕES */}
                    {conversation.length === 0 && !isLoading ? (
                        <div className='text-center text-gray-600 pt-8'>
                            <h3 className='font-semibold mb-4 text-lg'>Como posso ajudar?</h3>
                            <div className='space-y-2'>
                                {suggestions.map((s, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleSendMessage(undefined, s)}
                                        className='w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 text-sm text-gray-800 transition-colors'
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        conversation.map((msg, index) => (
                            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'bot' && <Bot className="text-indigo-600 flex-shrink-0 mt-1" />}
                                <div className={`px-4 py-2 rounded-lg max-w-[85%] break-words prose prose-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                </div>
                                {msg.role === 'user' && <User className="text-gray-600 flex-shrink-0 mt-1" />}
                            </div>
                        ))
                    )}
                     {isLoading && (
                        <div className="flex items-start gap-3">
                            <Bot className="text-indigo-600" />
                            <div className="px-4 py-2 rounded-lg bg-gray-200">
                                <Loader2 className="animate-spin text-indigo-500" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="p-4 border-t bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Pergunte algo sobre o ambiente..."
                        className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                        disabled={!selectedCompanyId || isLoading}
                    />
                    <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400" disabled={!selectedCompanyId || isLoading}>
                        <Send />
                    </button>
                </form>
            </div>
        </div>
    );
}
