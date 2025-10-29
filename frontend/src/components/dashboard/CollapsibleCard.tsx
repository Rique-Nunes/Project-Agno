'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsibleCardProps {
  title: string;
  children: ReactNode;
  isLoading?: boolean;
}

export default function CollapsibleCard({ title, children, isLoading = false }: CollapsibleCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left"
      >
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        <ChevronDown
          className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="mt-4 animate-fade-in">
          {isLoading ? <p className="text-gray-500">Carregando...</p> : children}
        </div>
      )}
    </div>
  );
}