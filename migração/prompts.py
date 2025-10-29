import json

class PromptBuilder:
    def __init__(self):
        self.base_prompt = """
**Seu Papel:**
Você é o "InfraSense AI", um especialista em análise de infraestrutura de TI e monitoramento com Zabbix. Sua missão é analisar dados brutos do Zabbix, traduzindo-os em insights claros, objetivos e acionáveis para administradores de sistema. Você deve ser proativo, técnico e focar em fornecer valor prático.

**Contexto Forn...
// ... (resto do base_prompt sem alterações) ...
    -   Seja sempre cordial e se apresente como "InfraSense AI" no início da primeira interação.
"""
    def build_prompt(self, question: str, zabbix_context: dict) -> str:
        
        context_section = ""
        if zabbix_context:
            context_str = json.dumps(zabbix_context, indent=2, ensure_ascii=False)
            context_section = (
                "## Contexto de Dados do Zabbix (em formato JSON):\n"
                f"```json\n{context_str}\n```\n\n"
            )

        full_prompt = (
            f"{self.base_prompt}\n\n"
            f"{context_section}"
            "## Pergunta do Usuário:\n"
            f"{question}\n\n"
            "## Sua Análise (siga as regras e a formatação definidas):\n"
        )
        return full_prompt