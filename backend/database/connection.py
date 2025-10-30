import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# --- Lógica de conexão para Produção (Cloud Run) e Desenvolvimento (Local) ---

# Verifica se está rodando no ambiente do Cloud Run
if os.environ.get("K_SERVICE"):
    # Configurações para Cloud SQL (PostgreSQL)
    db_user = os.environ.get("DB_USER")
    db_pass = os.environ.get("DB_PASS")
    db_name = os.environ.get("DB_NAME")
    db_connection_name = os.environ.get("DB_CONNECTION_NAME")

    # Monta a URL de conexão para o proxy do Cloud SQL
    DATABASE_URL = (
        f"postgresql+psycopg2://{db_user}:{db_pass}@/"
        f"{db_name}?host=/cloudsql/{db_connection_name}"
    )
    
    # Opções de engine para produção
    engine_options = {
        "pool_size": 5,
        "max_overflow": 2,
        "pool_timeout": 30,
        "pool_recycle": 1800,
    }
    engine = create_engine(DATABASE_URL, **engine_options)

else:
    # Configurações para desenvolvimento local (SQLite)
    DATABASE_URL = "sqlite:///./zabbix_copilot.db"
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )

# --- Fim da lógica de conexão ---


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def create_tables():
    # Se estiver usando SQLite local, cria as tabelas. Em produção, usamos Alembic/migrações.
    if "sqlite" in str(engine.url):
        from database.models import Empresa 
        from models.usuario import Usuario
        Base.metadata.create_all(bind=engine)

def get_db():
    """
    Função geradora para fornecer uma sessão de banco de dados por requisição.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()