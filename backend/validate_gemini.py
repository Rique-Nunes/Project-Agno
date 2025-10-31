import google.generativeai as genai
from dotenv import load_dotenv
import os
import sys

# 1. Carregar a API Key do seu arquivo .env
load_dotenv()
API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    print("ERRO: 'GOOGLE_API_KEY' não encontrada no seu arquivo .env.")
    print("Por favor, verifique se o arquivo .env está na mesma pasta.")
    sys.exit()

# 2. Configurar a biblioteca com sua chave
genai.configure(api_key=API_KEY)

print("Buscando todos os modelos disponíveis para sua chave de API...")
print("-" * 60)

# 3. Listas para organizar os modelos
modelos_de_chat = []
modelos_de_embedding = []
outros_modelos = []

try:
    # 4. Chamar a API para listar os modelos
    models = genai.list_models()
    
    # 5. Iterar e classificar os modelos
    for m in models:
        # Modelos de Embedding são usados pelo RAG (Indexador)
        if 'embedContent' in m.supported_generation_methods:
            modelos_de_embedding.append(m.name)
            
        # Modelos de Chat são usados para a conversa (app_chat.py)
        elif 'generateContent' in m.supported_generation_methods:
            modelos_de_chat.append(m.name)
            
        else:
            outros_modelos.append(m.name)

    # 6. Imprimir os resultados de forma clara
    print("\n✅ Modelos de Chat (Para o 'app_chat.py'):")
    if modelos_de_chat:
        for name in modelos_de_chat:
            print(f"  - {name}")
    else:
        print("  (Nenhum modelo de chat encontrado)")

    print("\n✅ Modelos de Embedding (Para o RAG e 'indexar.py'):")
    if modelos_de_embedding:
        for name in modelos_de_embedding:
            print(f"  - {name}")
            # Esta é a nossa correção!
            if "text-embedding-004" in name:
                print("      ^--- ÓTIMO! Este é o modelo que queremos usar.")
    else:
        print("  (Nenhum modelo de embedding encontrado - esta pode ser a causa do erro!)")
        
    if outros_modelos:
        print("\nOutros modelos:")
        for name in outros_modelos:
            print(f"  - {name}")

    print("-" * 60)
    print("\nConclusão:")
    print("Verifique se o modelo 'models/text-embedding-004' aparece na lista 'Embedding'.")
    print("Se sim, as correções que sugeri (de apagar o chroma_db e rodar o indexar.py) vão funcionar.")


except Exception as e:
    print(f"\n--- ERRO AO CHAMAR A API ---")
    print(f"Ocorreu um erro ao tentar listar os modelos: {e}")
    print("Isso pode indicar que sua chave de API é inválida ou não tem permissão para 'list_models'.")