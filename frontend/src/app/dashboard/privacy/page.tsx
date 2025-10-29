import { Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="bg-white text-gray-800 rounded-lg shadow-md p-8 max-w-4xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Política de Privacidade</h1>
        <p className="text-gray-500">Nosso Compromisso com a sua Privacidade</p>
      </header>

      <div className="space-y-8 text-gray-600 leading-relaxed">
        <section>
            <p className="text-sm text-gray-500 mb-4">Última atualização: 13/10/2025</p>
            <p>
                A sua privacidade e a segurança dos seus dados são de extrema importância para o InfraSense. Esta política descreve como tratamos as informações que você nos fornece.
            </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Coleta de Dados</h2>
          <p className="mb-4">Coletamos as seguintes informações:</p>
          <ul className="list-disc list-inside space-y-3">
            <li>
              <span className="font-semibold">Informações de Autenticação:</span> Seu nome e endereço de e-mail, conforme fornecidos pelo seu provedor de login (ex: Google), são usados exclusivamente para identificar sua conta e garantir um acesso seguro.
            </li>
            <li>
              <span className="font-semibold">Credenciais de Conexão Zabbix:</span> As URLs, nomes de usuário e tokens de API que você fornece para se conectar às suas instâncias Zabbix. Essas informações são armazenadas de forma segura e criptografada.
            </li>
            <li>
                <span className="font-semibold">Dados de Monitoramento (Metadados):</span> Para alimentar nossos modelos de IA, processamos metadados dos seus alertas e eventos Zabbix, como descrições de problemas, nomes de hosts e severidade. <span className="font-bold">Não coletamos ou armazenamos dados sensíveis contidos em seus sistemas.</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">Uso das Informações</h2>
          <p className="mb-4">As informações coletadas são utilizadas estritamente para:</p>
            <ul className="list-disc list-inside space-y-2">
                <li>Permitir a conexão da plataforma com suas instâncias Zabbix.</li>
                <li>Treinar e operar os modelos de Inteligência Artificial para fornecer as análises, relatórios e recomendações.</li>
                <li>Personalizar e melhorar sua experiência dentro da plataforma InfraSense.</li>
            </ul>
        </section>

        <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Segurança e Armazenamento</h2>
            <p>
            Todos os tokens e credenciais sensíveis são criptografados em repouso e em trânsito. Utilizamos as melhores práticas de segurança para proteger suas informações contra acesso não autorizado, alteração ou destruição. Seus dados de monitoramento não são compartilhados com terceiros e são processados em um ambiente seguro.
            </p>
        </section>
      </div>
    </div>
  );
}
