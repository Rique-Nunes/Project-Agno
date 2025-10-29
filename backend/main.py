from dotenv import load_dotenv
load_dotenv()

import uvicorn
from fastapi import FastAPI
from rich import print
from fastapi.middleware.cors import CORSMiddleware
# Removido 'report' para evitar duplicidade
from api import zabbix, chat, empresas, auth, usuarios, me
from database.connection import create_tables
# Import do novo router de relatórios
from api.routers import reports as reports_router

create_tables()

app = FastAPI(
    title="Zabbix Copilot API",
    description="API para análise de dados do Zabbix com IA",
    version="0.1.0",
)

origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:9010",
    "http://34.172.18.44:9010",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(me.router)
app.include_router(usuarios.router)
app.include_router(zabbix.router)
app.include_router(chat.router) 
app.include_router(empresas.router)
# Removida a linha do router antigo: app.include_router(report.router)
# CORREÇÃO: Adicionado o prefixo correto como uma string
app.include_router(reports_router.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Bem-vindo ao Zabbix Copilot API!"}

@app.get("/api/v1/status")
def get_status():
    print("[bold green]Requisição recebida em /api/v1/status[/bold green]")
    return {"status": "running"}

if __name__ == "__main__":
    print("[bold yellow]Iniciando o servidor FastAPI...[/bold yellow]")
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)