# 1. Importações de bibliotecas padrão e de terceiros
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from rich import print

# 2. Importações de módulos locais da aplicação
from api import auth, chat, empresas, me, usuarios, zabbix
from api.routers import reports as reports_router
from database.connection import create_tables

# --- INICIALIZAÇÃO DA APLICAÇÃO ---

# Carrega as variáveis de ambiente do arquivo .env
load_dotenv()

# Cria as tabelas do banco de dados (especialmente útil para o SQLite local)
create_tables()

# Cria a instância principal do FastAPI
app = FastAPI(
    title="Zabbix Copilot API",
    description="API para análise de dados do Zabbix com IA.",
    version="0.1.0",
)


# --- CONFIGURAÇÃO DE MIDDLEWARE ---

# Lista de origens permitidas para fazer requisições a esta API
origins = [
    "http://localhost:9010",  # Endereço do contêiner do frontend
    "http://127.0.0.1:9010",
    # Quando for para produção, adicione a URL do seu frontend aqui
    # "https://seu-frontend-em-producao.com" 
]

# Adiciona o middleware de CORS para permitir a comunicação entre domínios
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos os métodos (POST, GET, etc.)
    allow_headers=["*"],  # Permite todos os cabeçalhos
)


# --- REGISTRO DAS ROTAS (ENDPOINTS) ---

app.include_router(auth.router)
app.include_router(me.router)
app.include_router(usuarios.router)
app.include_router(zabbix.router)
app.include_router(chat.router)
app.include_router(empresas.router)
app.include_router(reports_router.router, prefix="/api/v1")


# --- ROTAS BÁSICAS ---

@app.get("/")
def read_root():
    """Endpoint raiz para verificar se a API está no ar."""
    return {"status": "ok", "message": "Bem-vindo ao Zabbix Copilot API!"}

@app.get("/api/v1/status")
def get_status():
    """Endpoint de status para monitoramento."""
    print("[bold green]Requisição recebida em /api/v1/status[/bold green]")
    return {"status": "running"}


# --- EXECUÇÃO PARA DESENVOLVIMENTO LOCAL ---

if __name__ == "__main__":
    # Este bloco só é executado quando você roda o script diretamente (ex: `python main.py`)
    # O Docker NÃO usa este bloco. Ele usa o comando do Dockerfile.
    print("[bold yellow]Iniciando o servidor FastAPI para desenvolvimento local...[/bold yellow]")
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)