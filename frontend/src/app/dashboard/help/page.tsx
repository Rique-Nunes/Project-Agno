import { Mail, LifeBuoy } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="bg-white text-gray-800 rounded-lg shadow-md p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Central de Ajuda</h1>
        <p className="text-gray-500">Ajuda e Contato</p>
      </header>

      <div className="space-y-6">
        <p className="text-gray-600">Para suporte ou dúvidas sobre a aplicação, entre em contato:</p>
        
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-800">Henrique Alves</h3>
          <div className="flex items-center space-x-2 mt-2 text-gray-500">
            <Mail className="h-4 w-4" />
            <a href="mailto:henrique.alves@ipnet.cloud" className="hover:text-indigo-600">
              henrique.alves@ipnet.cloud
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
