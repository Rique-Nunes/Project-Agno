import os
import google.generativeai as genai
from dotenv import load_dotenv

def configure_gemini():
    """
    Configura e inicializa a API do Google Gemini.
    """
    # --- Bloco de Diagnóstico ---
    print("\n--- INICIANDO DIAGNÓSTICO DE AMBIENTE ---")
    print(f"Diretório de trabalho atual (CWD): {os.getcwd()}")
    
    # A função load_dotenv() retorna True se encontrou e carregou o arquivo .env
    foi_carregado = load_dotenv()
    
    if foi_carregado:
        print("SUCESSO: O arquivo .env foi encontrado e carregado.")
    else:
        print("AVISO: Nenhum arquivo .env foi encontrado no diretório de trabalho ou nos diretórios pais.")
    print("-------------------------------------------\n")
    # --- Fim do Bloco de Diagnóstico ---

    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key:
        raise ValueError("A chave da API do Google não foi encontrada. Verifique se o arquivo .env está no diretório 'backend' e se a variável GOOGLE_API_KEY está definida corretamente.")
    
    genai.configure(api_key=google_api_key)
    print("Cliente Gemini inicializado com sucesso!")

def get_gemini_model(model_name="gemini-2.5-pro"):
    """
    Retorna uma instância do modelo generativo do Gemini.
    """
    try:
        model = genai.GenerativeModel(model_name)
        return model
    except Exception as e:
        print(f"Erro ao obter o modelo Gemini: {e}")
        raise

# Configura o Gemini quando o módulo é carregado
configure_gemini()