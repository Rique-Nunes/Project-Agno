import { Info } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-white text-gray-800 rounded-lg shadow-md p-8 max-w-4xl mx-auto">
      <header className="flex items-center space-x-4 mb-8">
        {/* Ícone representando a seção "Sobre" */}
        <div className="bg-purple-100 p-3 rounded-lg">
          <Info className="h-6 w-6 text-purple-700" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sobre o InfraSense</h1>
          <p className="text-gray-500">
            Tudo o que você precisa saber sobre a nossa missão, funcionamento e público.
          </p>
        </div>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Nossa Missão</h2>
          <p className="text-gray-600 leading-relaxed">
            O InfraSense nasceu com a missão de transformar a complexidade do monitoramento de infraestrutura em clareza e inteligência.
            Utilizamos o poder da Inteligência Artificial para enriquecer os dados do Zabbix, fornecendo aos administradores de sistemas e equipes
            de TI insights preditivos, diagnósticos rápidos e relatórios automatizados. Nosso objetivo é capacitar você a antecipar problemas,
            otimizar recursos e garantir a máxima disponibilidade dos seus serviços com menos esforço.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Como Funciona</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            A plataforma se conecta de forma segura às suas instâncias Zabbix. Os dados coletados são então processados por nossos modelos de
            IA para:
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>
              <span className="font-semibold">Analisar Alertas:</span> Fornecer recomendações detalhadas e passos de correção para os alertas gerados.
            </li>
            <li>
              <span className="font-semibold">Gerar Relatórios:</span> Criar relatórios técnicos e executivos sobre performance, disponibilidade e tendências de uso.
            </li>
            <li>
              <span className="font-semibold">Correlacionar Eventos:</span> Identificar padrões e relações entre diferentes métricas e eventos que poderiam passar despercebidos.
            </li>
            <li>
              <span className="font-semibold">Prever Falhas:</span> Analisar tendências históricas para prever futuras anomalias, como esgotamento de disco ou picos de CPU.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Para Quem é o InfraSense?</h2>
          <p className="text-gray-600 leading-relaxed">
            O InfraSense é ideal para Provedores de Serviços Gerenciados (MSPs), equipes de DevOps, administradores de sistemas e qualquer
            organização que utilize o Zabbix para monitorar sua infraestrutura e que busca otimizar suas operações, reduzir o tempo de resolução de
            incidentes (MTTR) e adotar uma postura proativa em relação à saúde de seus sistemas.
          </p>
        </section>
      </div>
    </div>
  );
}
