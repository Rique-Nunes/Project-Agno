import re
import traceback
import json
from llm.gemini_client import get_gemini_model
from llm.prompts import PromptBuilder
from crud.empresa import get_empresa_by_id
from database.connection import SessionLocal
from services.zabbix_service import get_full_zabbix_context
from utils.security import descriptografar_token

class GeminiService:
    def __init__(self, prompt_builder: PromptBuilder):
        self.model = get_gemini_model()
        self.prompt_builder = prompt_builder

    # --- NOVO MÉTODO ADICIONADO PARA A MIGRAÇÃO ---
    def generate_report(self, zabbix_context_data: dict, user_query: str):
        """
        Gera um relatório de IA com base em um contexto Zabbix pré-coletado
        para um host específico.
        """
        try:
            # Reutiliza o prompt builder existente para construir o prompt
            # A lógica do prompt em si fica encapsulada no PromptBuilder
            full_prompt = self.prompt_builder.build_prompt(user_query, zabbix_context_data)

            print("\n--- DEBUG: PROMPT DE RELATÓRIO ENVIADO PARA A IA ---")
            print(full_prompt)
            print("--- FIM PROMPT ---\n")

            # Envia para a IA
            response = self.model.generate_content(full_prompt)
            
            print("--- RESPOSTA DA IA (RELATÓRIO) ---")
            print(response.text)
            print("---------------------------------")

            # Retorna apenas o texto do relatório, como esperado pelo report_service
            return response.text
        
        except Exception as e:
            print("!!!!!!!!!!!!!! ERRO AO GERAR RELATÓRIO NO SERVIÇO GEMINI !!!!!!!!!!!!!!")
            traceback.print_exc()
            print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            # Re-lança a exceção para ser tratada pela camada superior (report_service)
            raise e

    # --- MÉTODO EXISTENTE MANTIDO INTACTO ---
    def process_user_question(self, question: str, empresa_id: int):
        db = SessionLocal()
        try:
            empresa = get_empresa_by_id(db, empresa_id)
            if not empresa:
                return {"error": "Empresa não encontrada."}

            api_url = empresa.url_zabbix
            api_token = descriptografar_token(empresa.token_zabbix_criptografado)
            
            print("\n--- DEBUG: BUSCANDO CONTEXTO ZABBIX (GERAL) ---")
            zabbix_data = get_full_zabbix_context(api_url, api_token)
            print("--- FIM CONTEXTO ZABBIX ---\n")
            
            full_prompt = self.prompt_builder.build_prompt(question, zabbix_data)

            print("\n--- DEBUG: PROMPT GERAL ENVIADO PARA A IA ---")
            print(full_prompt)
            print("--- FIM PROMPT ---\n")

            response = self.model.generate_content(full_prompt)
            
            print("--- RESPOSTA DA IA (GERAL) ---")
            print(response.text)
            print("-----------------------------")

            return {"response": response.text}
        
        except Exception as e:
            print("!!!!!!!!!!!!!! ERRO INESPERADO NO SERVIÇO GEMINI (GERAL) !!!!!!!!!!!!!!")
            traceback.print_exc()
            print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            return {"error": f"Ocorreu um erro ao processar sua solicitação com o Gemini: {e}"}
        finally:
            db.close()