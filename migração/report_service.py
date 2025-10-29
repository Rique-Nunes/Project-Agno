import json
import time
from typing import Dict, List, Any, Optional
from services import zabbix_service
from services.gemini_service import GeminiService
from llm.prompts import PromptBuilder

class ReportService:
    def __init__(self):
        self.prompt_builder = PromptBuilder()
        self.gemini_service = GeminiService(self.prompt_builder)
    
    def generate_performance_report(
        self, 
        api_url: str, 
        token: str, 
        host_id: str, 
        empresa_id: int,
        report_type: str = "performance",
        period: str = "7d"
    ) -> Dict[str, Any]:
        """
        Gera um relatório especializado de performance, capacidade, incidentes ou executivo.
        """
        try:
            # Buscar todos os dados necessários
            host_info = zabbix_service.get_host_system_info(api_url, token, host_id)
            current_metrics = zabbix_service.get_key_metrics(api_url, token, host_id)
            host_triggers = zabbix_service.get_host_triggers(api_url, token, host_id)
            
            # Buscar dados históricos
            days = 7 if period == "7d" else (1 if period == "24h" else 30)
            time_till = int(time.time())
            time_from = time_till - (days * 24 * 60 * 60)
            
            alert_history = zabbix_service.get_alert_history(
                api_url, token, time_from, time_till
            )
            
            event_log = zabbix_service.get_event_log(
                api_url, token, time_from, time_till
            )
            
            # Preparar dados estruturados para análise
            report_data = {
                "host_info": host_info,
                "current_metrics": current_metrics,
                "active_triggers": host_triggers,
                "alert_history": alert_history,
                "event_log": event_log,
                "report_type": report_type,
                "period": period,
                "report_timestamp": time.time(),
                "analysis_context": {
                    "total_hosts": 1,  # Para análise individual
                    "period_analyzed": period,
                    "data_sources": ["zabbix_api", "gemini_ai"]
                }
            }
            
            # Gerar prompt especializado por tipo de relatório
            report_prompt = self._build_specialized_prompt(report_data, report_type)
            
            # Processar com IA
            ai_result = self.gemini_service.process_user_question(
                question=report_prompt,
                empresa_id=empresa_id
            )
            
            if "error" in ai_result:
                raise Exception(f"Erro na IA: {ai_result['error']}")
            
            # Converter métricas de lista para dicionário estruturado
            metrics_dict = {}
            if isinstance(current_metrics, list):
                for metric in current_metrics:
                    key = metric.get('key', 'unknown')
                    metrics_dict[key] = {
                        'value': metric.get('value', 'N/A'),
                        'label': metric.get('label', key),
                        'partition': metric.get('partition', None)
                    }
            else:
                metrics_dict = current_metrics or {}
            
            return {
                "report_content": ai_result["response"],
                "host_info": host_info,
                "metrics": metrics_dict,
                "triggers": host_triggers,
                "alert_history": alert_history,
                "event_log": event_log,
                "generated_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
                "period_analyzed": period,
                "data_quality": self._assess_data_quality(report_data)
            }
            
        except Exception as e:
            raise Exception(f"Erro ao gerar relatório: {str(e)}")
    
    def _build_specialized_prompt(self, report_data: Dict[str, Any], report_type: str) -> str:
        """
        Constrói um prompt especializado baseado no tipo de relatório.
        """
        base_instructions = """
        **TAREFA ESPECIALIZADA:** Gerar um relatório de {report_type_upper} profissional e técnico.

        **CONTEXTO DOS DADOS:**
        {data_json}

        **INSTRUÇÕES ESPECÍFICAS PARA RELATÓRIO DE {report_type_upper}:**

        1. **Estrutura Obrigatória:**
           - 📊 **Resumo Executivo** (2-3 parágrafos com status geral)
           - 📈 **Análise de Tendências** (padrões identificados no período)
           - 🎯 **Principais Problemas** (top 5 mais frequentes)
           - 💡 **Recomendações Específicas** (ações práticas e priorizadas)
           - ⚠️ **Aviso de Responsabilidade** (sobre dados e contato)

        2. **Foco por Tipo de Relatório:**
        """.format(
            report_type_upper=report_type.upper(),
            data_json=json.dumps(report_data, indent=2, ensure_ascii=False)
        )

        type_specific_instructions = {
            "performance": """
                   - **Performance:** Foque em otimização, gargalos, eficiência
                   - **Métricas:** CPU, Memória, Disco, Rede com análise de uso
                   - **Recomendações:** Melhorias específicas de performance
            """,
            "capacity": """
                   - **Capacidade:** Foque em crescimento, planejamento, recursos
                   - **Tendências:** Projeções de uso e necessidades futuras
                   - **Recomendações:** Planejamento de capacidade e upgrades
            """,
            "incidents": """
                   - **Incidentes:** Foque em problemas, resolução, prevenção
                   - **Análise:** Tempo de resolução, frequência, impacto
                   - **Recomendações:** Melhorias em processos e monitoramento
            """,
            "executive": """
                   - **Executivo:** Foque em visão estratégica, ROI, riscos
                   - **Resumo:** Status geral, principais preocupações
                   - **Recomendações:** Decisões estratégicas e investimentos
            """
        }

        final_instructions = """
        3. **Tom e Estilo:**
           - Escreva como um {audience}
           - Use linguagem {language_style}
           - Seja objetivo, prático e acionável
           - Use emojis para melhor legibilidade

        4. **Análise de Dados:**
           - Use APENAS os dados fornecidos
           - Identifique padrões e correlações
           - Quantifique problemas quando possível
           - Priorize por impacto e frequência

        5. **Recomendações:**
           - Seja específico e prático
           - Priorize por criticidade e facilidade de implementação
           - Inclua estimativas de impacto quando possível
           - Mencione quando contatar administrador

        **IMPORTANTE:** Se algum dado estiver ausente, mencione claramente e sugira melhorias de monitoramento.
        """.format(
            audience="consultor sênior" if report_type == "executive" else "SRE/Analista experiente",
            language_style="estratégica e de negócios" if report_type == "executive" else "técnica mas acessível"
        )

        return base_instructions + type_specific_instructions.get(report_type, "") + final_instructions

    def _build_report_prompt(self, report_data: Dict[str, Any]) -> str:
        """
        Constrói um prompt especializado para geração de relatórios.
        """
        return f"""
        **TAREFA ESPECIALIZADA:** Gerar um relatório técnico completo e profissional para análise de infraestrutura.

        **CONTEXTO COMPLETO DOS DADOS:**
        ```json
        {json.dumps(report_data, indent=2, ensure_ascii=False)}
        ```

        **INSTRUÇÕES DETALHADAS:**

        1. **Estrutura Obrigatória do Relatório:**
           - 📊 **Resumo Executivo** (2-3 parágrafos)
           - 🖥️ **Status Atual do Host** (informações básicas, uptime, sistema)
           - 📈 **Análise de Métricas** (CPU, Memória, Disco, Rede com interpretação)
           - 🚨 **Análise de Alertas e Eventos** (problemas ativos e históricos)
           - 💡 **Recomendações Técnicas** (ações específicas e práticas)
           - ⚠️ **Aviso de Responsabilidade** (sobre dados e contato com admin)

        2. **Tom e Estilo:**
           - Escreva como um SRE/Analista experiente
           - Use linguagem técnica mas acessível
           - Seja objetivo e prático
           - Use emojis para melhor legibilidade

        3. **Análise de Dados:**
           - Use APENAS os dados fornecidos
           - Se algum dado estiver ausente, mencione claramente
           - Correlacione métricas com alertas quando possível
           - Identifique padrões e tendências

        4. **Recomendações:**
           - Seja específico e acionável
           - Priorize por criticidade
           - Inclua configurações sugeridas quando aplicável
           - Mencione quando contatar o administrador

        5. **Aviso Final:**
           - Inclua aviso sobre divergências de dados
           - Oriente sobre contato com administrador
           - Sugira melhorias de monitoramento se necessário

        **IMPORTANTE:** Se algum dado estiver ausente ou inconsistente, mencione isso claramente e sugira configurações de monitoramento específicas.
        """
    
    def _assess_data_quality(self, report_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Avalia a qualidade dos dados coletados para o relatório.
        """
        quality_score = 0
        total_checks = 0
        issues = []
        
        # Verificar host_info
        total_checks += 1
        if report_data.get("host_info") and report_data["host_info"].get("host"):
            quality_score += 1
        else:
            issues.append("Informações do host incompletas")
        
        # Verificar métricas
        total_checks += 1
        if report_data.get("current_metrics") and len(report_data["current_metrics"]) > 0:
            quality_score += 1
        else:
            issues.append("Métricas atuais não disponíveis")
        
        # Verificar triggers
        total_checks += 1
        if report_data.get("active_triggers"):
            quality_score += 1
        else:
            issues.append("Dados de triggers não disponíveis")
        
        # Verificar histórico
        total_checks += 1
        if report_data.get("alert_history") and len(report_data["alert_history"]) > 0:
            quality_score += 1
        else:
            issues.append("Histórico de alertas limitado")
        
        quality_percentage = (quality_score / total_checks) * 100
        
        return {
            "score": quality_percentage,
            "issues": issues,
            "recommendation": self._get_quality_recommendation(quality_percentage)
        }
    
    def _get_quality_recommendation(self, score: float) -> str:
        """
        Retorna recomendação baseada na qualidade dos dados.
        """
        if score >= 80:
            return "Dados de alta qualidade - relatório confiável"
        elif score >= 60:
            return "Dados de qualidade moderada - algumas informações podem estar limitadas"
        elif score >= 40:
            return "Dados de qualidade baixa - considere verificar configurações de monitoramento"
        else:
            return "Dados insuficientes - contate o administrador para configuração de monitoramento"
    
    def generate_comprehensive_report(
        self, 
        api_url: str, 
        token: str, 
        host_id: str,
        user_query: str,
        empresa_id: int,
        period: str = "7d"
    ) -> Dict[str, Any]:
        """
        Gera um relatório completo baseado na consulta do usuário usando IA.
        """
        try:
            # Se host_id está vazio, tentar encontrar host mencionado na consulta
            if not host_id and user_query:
                host_id = self._extract_host_from_query(api_url, token, user_query)
            
            if not host_id:
                raise Exception("Nenhum host especificado. Selecione um host ou mencione o nome do servidor na consulta.")
            
            # Buscar dados do host específico
            host_info = zabbix_service.get_host_system_info(api_url, token, host_id)
            current_metrics = zabbix_service.get_key_metrics(api_url, token, host_id)
            host_triggers = zabbix_service.get_host_triggers(api_url, token, host_id)
            
            # Buscar dados históricos
            days = 7 if period == "7d" else (1 if period == "24h" else 30)
            time_till = int(time.time())
            time_from = time_till - (days * 24 * 60 * 60)
            
            alert_history = zabbix_service.get_alert_history(
                api_url, token, time_from, time_till
            )
            
            event_log = zabbix_service.get_event_log(
                api_url, token, time_from, time_till
            )
            
            # Preparar dados estruturados para análise
            report_data = {
                "host_info": host_info,
                "current_metrics": current_metrics,
                "active_triggers": host_triggers,
                "alert_history": alert_history,
                "event_log": event_log,
                "user_query": user_query,
                "period": period,
                "report_timestamp": time.time(),
                "analysis_context": {
                    "total_hosts": 1,
                    "period_analyzed": period,
                    "data_sources": ["zabbix_api", "gemini_ai"]
                }
            }
            
            # Construir prompt especializado para consulta do usuário
            ai_prompt = self._build_user_query_prompt(report_data, user_query)
            
            # Processar com IA
            ai_result = self.gemini_service.process_user_question(
                question=ai_prompt,
                empresa_id=empresa_id
            )
            
            if "error" in ai_result:
                raise Exception(f"Erro na IA: {ai_result['error']}")
            
            # Converter métricas de lista para dicionário estruturado
            metrics_dict = {}
            if isinstance(current_metrics, list):
                for metric in current_metrics:
                    key = metric.get('key', 'unknown')
                    metrics_dict[key] = {
                        'value': metric.get('value', 'N/A'),
                        'label': metric.get('label', key),
                        'partition': metric.get('partition', None)
                    }
            else:
                metrics_dict = current_metrics or {}
            
            return {
                "report_content": ai_result["response"],
                "host_info": host_info,
                "metrics": metrics_dict,
                "triggers": host_triggers,
                "generated_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
                "period_analyzed": period,
                "user_query": user_query,
                "data_quality": self._assess_data_quality(report_data)
            }
            
        except Exception as e:
            raise Exception(f"Erro ao gerar relatório: {str(e)}")
    
    def _extract_host_from_query(self, api_url: str, token: str, user_query: str) -> str:
        """
        Tenta extrair o nome do host da consulta do usuário e encontrar o host_id correspondente.
        """
        try:
            # Buscar todos os hosts disponíveis
            hosts = zabbix_service.get_zabbix_hosts(api_url, token)
            
            # Procurar por nomes de hosts mencionados na consulta
            query_lower = user_query.lower()
            
            for host in hosts:
                host_name = host.get('name', '').lower()
                host_host = host.get('host', '').lower()
                
                # Verificar se o nome do host aparece na consulta
                if host_name in query_lower or host_host in query_lower:
                    return host.get('hostid')
            
            # Se não encontrou, retornar o primeiro host disponível
            if hosts:
                return hosts[0].get('hostid')
            
            return None
            
        except Exception as e:
            return None
    
    def _build_user_query_prompt(self, report_data: Dict[str, Any], user_query: str) -> str:
        """
        Constrói um prompt especializado baseado na consulta específica do usuário.
        """
        return f"""
        **TAREFA ESPECIALIZADA:** Responder à consulta específica do usuário com análise técnica precisa.

        **CONSULTA DO USUÁRIO:**
        "{user_query}"

        **CONTEXTO COMPLETO DOS DADOS DISPONÍVEIS:**
        ```json
        {json.dumps(report_data, indent=2, ensure_ascii=False)}
        ```

        **INSTRUÇÕES ESPECÍFICAS:**

        1. **Foco na Consulta:**
           - Responda EXATAMENTE o que foi perguntado
           - Se a pergunta envolve projeções/futuro, use dados históricos para análise
           - Se envolve estatísticas específicas, calcule com base nos dados disponíveis
           - Se não conseguir responder completamente, explique o motivo e sugira soluções

        2. **Análise Técnica:**
           - Use APENAS os dados fornecidos
           - Seja preciso com números e métricas
           - Identifique padrões e tendências quando relevante
           - Correlacione diferentes métricas quando aplicável

        3. **Tom e Estilo:**
           - Escreva como um SRE/Analista experiente
           - Use linguagem técnica mas clara
           - Seja objetivo e prático
           - Use emojis para melhor legibilidade quando apropriado

        4. **Estrutura da Resposta:**
           - Comece com uma resposta direta à pergunta
           - Forneça detalhes técnicos relevantes
           - Inclua gráficos/texto explicativo quando necessário
           - Termine com recomendações práticas se aplicável

        5. **Limitações e Sugestões:**
           - Se algum dado estiver ausente, mencione claramente
           - Sugira configurações de monitoramento específicas se necessário
           - Indique quando contatar o administrador

        **IMPORTANTE:** 
        - Se não conseguir responder à pergunta com os dados disponíveis, explique claramente o motivo
        - Sugira melhorias de monitoramento específicas para obter a informação desejada
        - Seja honesto sobre limitações dos dados atuais
        """

    def generate_quick_summary(
        self, 
        api_url: str, 
        token: str, 
        host_id: str,
        empresa_id: int
    ) -> Dict[str, Any]:
        """
        Gera um resumo rápido do host para preview.
        """
        try:
            host_info = zabbix_service.get_host_system_info(api_url, token, host_id)
            metrics = zabbix_service.get_key_metrics(api_url, token, host_id)
            triggers = zabbix_service.get_host_triggers(api_url, token, host_id)
            
            # Contar problemas ativos
            active_problems = 0
            if triggers:
                active_problems = (
                    len(triggers.get("critical", [])) + 
                    len(triggers.get("warning", [])) + 
                    len(triggers.get("info", []))
                )
            
            # Determinar status geral
            if active_problems == 0:
                status = "✅ Saudável"
                status_color = "green"
            elif len(triggers.get("critical", [])) > 0:
                status = "🔴 Crítico"
                status_color = "red"
            elif len(triggers.get("warning", [])) > 0:
                status = "🟡 Atenção"
                status_color = "yellow"
            else:
                status = "🔵 Informativo"
                status_color = "blue"
            
            return {
                "host_name": host_info.get("host", {}).get("name", "N/A"),
                "status": status,
                "status_color": status_color,
                "active_problems": active_problems,
                "uptime": host_info.get("system", {}).get("uptime", "N/A"),
                "os": host_info.get("system", {}).get("os", "N/A"),
                "metrics_count": len(metrics) if metrics else 0,
                "last_updated": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
            }
            
        except Exception as e:
            return {
                "error": f"Erro ao gerar resumo: {str(e)}",
                "host_name": "N/A",
                "status": "❌ Erro",
                "status_color": "red"
            }
