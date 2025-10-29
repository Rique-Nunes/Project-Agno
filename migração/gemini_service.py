import re
import traceback
from llm.gemini_client import get_gemini_model
from llm.prompts import PromptBuilder
from crud.empresa import get_empresa_by_id
from database.connection import SessionLocal 
from services.zabbix_service import (
    get_zabbix_hosts, get_active_triggers, get_key_metrics, get_full_zabbix_context
    
)
from utils.security import descriptografar_token

class GeminiService:
    def __init__(self, prompt_builder: PromptBuilder):
        self.model = get_gemini_model()
        self.prompt_builder = prompt_builder

    def process_user_question(self, question: str, empresa_id: int):
        db = SessionLocal()
        try:
            empresa = get_empresa_by_id(db, empresa_id)
            if not empresa:
                return {"error": "Empresa não encontrada."}

            api_url = empresa.url_zabbix
            api_token = descriptografar_token(empresa.token_zabbix_criptografado)
            
            zabbix_data = {} 

            is_specific_alert_analysis = "analise e forneça uma tratativa para o seguinte alerta" in question.lower()

            if not is_specific_alert_analysis:
                full_context= get_full_zabbix_context(api_url, api_token)
                
                hosts_list = full_context.get("hosts", [])
                
                zabbix_data = full_context
                
                mentioned_host = None
                for host in hosts_list:
                    if re.search(r'\b' + re.escape(host['name']) + r'\b', question, re.IGNORECASE):
                        mentioned_host = host
                        break

                if mentioned_host:
                    host_id = mentioned_host['hostid']
                    host_name = mentioned_host['name']
                    
                    key_metrics = get_key_metrics(api_url, api_token, host_id)
                    zabbix_data["specific_host_metrics"] = {
                        "host": host_name,
                        "metrics": key_metrics
                    }

            full_prompt = self.prompt_builder.build_prompt(question, zabbix_data)

            response = self.model.generate_content(full_prompt)
            return {"response": response.text}
        
        except Exception as e:
            print("!!!!!!!!!!!!!! ERRO INESPERADO NO SERVIÇO GEMINI !!!!!!!!!!!!!!")
            print(f"Tipo de Erro: {type(e).__name__}")
            print(f"Mensagem: {e}")
            traceback.print_exc()
            print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            return {"error": f"Ocorreu um erro ao processar sua solicitação com o Gemini: {e}"}
        finally:
            db.close()