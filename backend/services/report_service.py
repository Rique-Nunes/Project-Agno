import os
from datetime import datetime
import time
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from rich import print
import json

from crud.empresa import get_empresa_by_id
from services.gemini_service import GeminiService
from llm.prompts import PromptBuilder
from services import zabbix_service
from utils.security import descriptografar_token

class ReportService:
    def __init__(self, db: Session):
        self.db = db
        self.prompt_builder = PromptBuilder()
        self.gemini_service = GeminiService(self.prompt_builder)

    def generate_comprehensive_report(
        self,
        empresa_id: int,
        host_id: str,
        user_query: str,
        period: str = "7d"
    ) -> Dict[str, Any]:
        try:
            db_empresa = get_empresa_by_id(self.db, empresa_id=empresa_id)
            if not db_empresa:
                raise Exception("Empresa não encontrada")

            api_url = db_empresa.url_zabbix
            token = descriptografar_token(db_empresa.token_zabbix_criptografado)

            # 1. Coleta de Dados Abrangente (como no original)
            host_info = zabbix_service.get_host_system_info(api_url, token, host_id)
            current_metrics = zabbix_service.get_key_metrics(api_url, token, host_id)
            host_triggers = zabbix_service.get_host_triggers(api_url, token, host_id)

            days = 7 if period == "7d" else 30
            time_till = int(time.time())
            time_from = time_till - (days * 24 * 60 * 60)

            alert_history = zabbix_service.get_alert_history(api_url, token, time_from, time_till, hostids=[host_id])
            event_log = zabbix_service.get_event_log(api_url, token, time_from, time_till, hostids=[host_id])

            # 2. Montagem do Contexto para a IA
            zabbix_context_data = {
                "host_info": host_info,
                "current_metrics": current_metrics,
                "active_triggers": host_triggers,
                "alert_history": alert_history,
                "event_log": event_log,
                "period_analyzed": f"{days} dias"
            }

            # 3. Geração do Relatório com a IA
            report_content = self.gemini_service.generate_report(zabbix_context_data, user_query)

            # 4. Formatação da Resposta para o Frontend
            metrics_dict = {m['key']: m['value'] for m in current_metrics} if isinstance(current_metrics, list) else {}
            
            # Contagem correta dos eventos para os cards
            critical_events_count = len([alert for alert in alert_history if alert.get('priority') in ['4', '5']])
            warning_events_count = len([alert for alert in alert_history if alert.get('priority') == '3'])


            return {
                "report_content": report_content,
                "host_info": host_info,
                "metrics": metrics_dict,
                "triggers": host_triggers,
                "event_summary": {
                    "total_events": len(event_log),
                    "critical_events": critical_events_count,
                    "warning_events": warning_events_count
                },
                "generated_at": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"!!!!!!!!!!!!!! ERRO EM REPORT_SERVICE !!!!!!!!!!!!!!")
            import traceback
            traceback.print_exc()
            print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            # Re-lança a exceção para que o FastAPI possa capturá-la e retornar um 500
            raise e
