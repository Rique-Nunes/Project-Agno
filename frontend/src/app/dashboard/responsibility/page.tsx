import { AlertTriangle, FileLock } from 'lucide-react';

export default function ResponsibilityPage() {
  return (
    <div className="bg-white text-gray-800 rounded-lg shadow-md p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Uso Responsável da IA</h1>
        <p className="text-gray-500">Entendendo as Capacidades e Limitações da IA</p>
      </header>

      <div className="space-y-8 text-gray-600 leading-relaxed">
        <section>
          <p>
            O InfraSense utiliza modelos de Inteligência Artificial de ponta para fornecer insights e automações. É fundamental que você, como usuário, compreenda como usar essa tecnologia de forma responsável.
          </p>
        </section>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <div className="flex">
                <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" aria-hidden="true" />
                </div>
                <div className="ml-3">
                    <p className="text-sm text-yellow-800">
                    <span className="font-bold">A IA é uma Ferramenta de Apoio:</span> As análises, recomendações e relatórios gerados pela IA devem ser considerados como sugestões e pontos de partida. Eles não substituem o julgamento técnico, a experiência e a validação de um profissional qualificado.
                    </p>
                </div>
            </div>
        </div>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Suas Responsabilidades</h2>
          <ul className="list-disc list-inside space-y-3">
            <li><span className="font-semibold">Revisão e Validação:</span> Sempre revise as sugestões fornecidas pela IA antes de aplicá-las em um ambiente de produção. Teste os comandos e scripts em um ambiente seguro e controlado.</li>
            <li><span className="font-semibold">Contexto é Crucial:</span> A qualidade das respostas da IA depende da qualidade dos dados fornecidos. Certifique-se de que os nomes de hosts, alertas e métricas no seu Zabbix sejam claros e descritivos.</li>
            <li><span className="font-semibold">Não Insira Dados Sensíveis:</span> Evite inserir informações confidenciais, pessoais ou de segurança nos campos de texto abertos, como no chat da IA ou na descrição de relatórios. A plataforma foi projetada para analisar metadados e não o conteúdo de seus sistemas.</li>
            <li><span className="font-semibold">Decisão Final:</span> A decisão final e a responsabilidade pela execução de qualquer ação em sua infraestrutura são sempre suas. O InfraSense atua como um copiloto inteligente, mas o piloto é você.</li>
          </ul>
        </section>

        <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Limitações da Tecnologia</h2>
            <p>
            Como toda tecnologia baseada em IA, o InfraSense pode, ocasionalmente, gerar informações incorretas, imprecisas ou incompletas (um fenômeno conhecido como "alucinação"). Estamos em constante aprimoramento para minimizar esses eventos, mas é importante estar ciente dessa possibilidade.
            </p>
        </section>
      </div>
    </div>
  );
}
