'use client';

import { useState } from 'react';
import AiAssistantIcon from './AiAssistantIcon';
import fetchWithAuth from '@/lib/fetchwithauth';
import ReactMarkdown from 'react-markdown';

interface AiAssistantProps {
    empresaId: number | undefined;
    hostId: string;
}

export default function AiAssistant({ empresaId, hostId }: AiAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ type: 'user' | 'ai', text: string }[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const examplePrompts = [
        "Como está a saúde do servidor?",
        "Mostre o uso de CPU nas últimas horas.",
        "Existem alertas críticos de banco de dados?",
        "Qual o status da memória deste host?",
    ];
    
    const handleSendMessage = async (promptText?: string) => {
        const messageText = promptText || userInput;
        if (!messageText.trim() || isLoading) return;

        const newMessages = [...messages, { type: 'user' as const, text: messageText }];
        setMessages(newMessages);
        setUserInput('');
        setIsLoading(true);

        try {
            const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_question: messageText,
                    empresa_id: empresaId,
                    host_id: hostId
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Ocorreu um erro no servidor.');
            }

            const result = await response.json();
            const aiResponse = result.response || result.detail || "Recebi uma resposta, mas não consegui formatá-la.";
            setMessages([...newMessages, { type: 'ai' as const, text: aiResponse }]);

        } catch (error: any) {
            const errorMessage = `Erro: ${error.message}`;
            setMessages([...newMessages, { type: 'ai' as const, text: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleClearChat = () => {
        setMessages([]);
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 right-8 bg-cyan-600 text-white p-4 rounded-full shadow-lg hover:bg-cyan-700 transition-transform hover:scale-110 z-50"
                aria-label="Abrir Assistente de IA"
            >
                <AiAssistantIcon />
            </button>
        );
    }

    return (
        <div className="fixed bottom-8 right-8 w-96 h-[600px] bg-gray-800 border border-cyan-500/50 rounded-lg shadow-2xl flex flex-col z-50 text-white">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <AiAssistantIcon className="w-6 h-6 text-cyan-400" />
                    <h2 className="text-lg font-bold">AI Assistant</h2>
                </div>
                <div>
                    <button onClick={handleClearChat} className="text-gray-400 hover:text-white text-sm mr-3 px-2 py-1 rounded hover:bg-gray-700">
                        Limpar
                    </button>
                    <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white text-xl">&times;</button>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400">
                        <p className="mb-4">Bem-vindo ao Zabbix AI Assistant!</p>
                        {examplePrompts.map((prompt, i) => (
                            <button key={i} onClick={() => handleSendMessage(prompt)} className="w-full text-left bg-gray-700 p-2 rounded-md mb-2 hover:bg-gray-600 text-sm">
                                {prompt}
                            </button>
                        ))}
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-lg ${msg.type === 'user' ? 'bg-cyan-600' : 'bg-gray-700'}`}>
                                {msg.type === 'ai' ? (
                                    <ReactMarkdown
                                        components={{
                                            p: ({ node, ...props }) => <p className="prose prose-invert prose-sm max-w-none" {...props} />
                                        }}
                                    >
                                        {msg.text}
                                    </ReactMarkdown>
                                ) : (
                                    <p>{msg.text}</p>
                                )}
                            </div>
                        </div>
                    ))
                )}
                {isLoading && <p className="text-gray-400 text-center animate-pulse">Analisando...</p>}
            </div>

            <div className="p-4 border-t border-gray-700">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Pergunte algo sobre o host..."
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-cyan-500 focus:border-cyan-500"
                    />
                    <button onClick={() => handleSendMessage()} disabled={isLoading} className="p-2 bg-cyan-600 rounded-md hover:bg-cyan-700 disabled:bg-gray-600">
                        &rarr;
                    </button>
                </div>
            </div>
        </div>
    );
}