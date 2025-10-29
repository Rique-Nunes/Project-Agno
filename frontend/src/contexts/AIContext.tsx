'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface Message {
    role: 'user' | 'bot';
    content: string;
}

interface AIContextType {
    isVisible: boolean;
    toggle: () => void;
    close: () => void;
    conversation: Message[];
    setConversation: (conversation: Message[]) => void;
    clearConversation: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider = ({ children }: { children: ReactNode }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [conversation, setConversation] = useState<Message[]>([]);

    const toggle = () => setIsVisible(prev => !prev);
    const close = () => setIsVisible(false);
    const clearConversation = () => {
        setConversation([]);
    };

    return (
        <AIContext.Provider value={{ 
            isVisible, 
            toggle, 
            close, 
            conversation, 
            setConversation, 
            clearConversation 
        }}>
            {children}
        </AIContext.Provider>
    );
};

export const useAI = () => {
    const context = useContext(AIContext);
    if (context === undefined) {
        throw new Error('useAI must be used within an AIProvider');
    }
    return context;
};