'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, User, Send } from 'lucide-react';
import { postChatMessage } from '@/services/api';

interface Message { id: string; role: 'user' | 'assistant'; content: string; }

export function AiQueryPanel({ selectedHost }: { selectedHost: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    try {
      // REAPLICANDO: Envia o host selecionado para a IA
      const aiResponse = await postChatMessage(currentInput, selectedHost);
      const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: aiResponse.response };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: 'Desculpe, não consegui obter uma resposta.' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader><CardTitle>AI Assistant</CardTitle></CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && <div className="text-center text-sm text-muted-foreground"><Bot className="mx-auto h-10 w-10 mb-2" /><p>Pergunte-me algo sobre o host selecionado.</p></div>}
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && <Bot className="h-6 w-6" />}
            <div className={`rounded-lg p-3 text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{m.content}</div>
            {m.role === 'user' && <User className="h-6 w-6" />}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>
      <CardFooter className="border-t pt-4">
        <form onSubmit={handleSubmit} className="w-full flex items-center gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Pergunte sobre os alertas..." disabled={isLoading} />
          <Button type="submit" size="icon" disabled={isLoading}><Send className="h-4 w-4" /></Button>
        </form>
      </CardFooter>
    </Card>
  );
}