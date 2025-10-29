from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base

# URL de conexão para o banco de dados SQLite
DATABASE_URL = "sqlite:///./zabbix_copilot.db"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def create_tables():
    # Importar todos os modelos aqui garante que o SQLAlchemy os conheça
    from database.models import Empresa 
    from models.usuario import Usuario
    Base.metadata.create_all(bind=engine)

# --- NOVA FUNÇÃO MOVIDA PARA CÁ ---
def get_db():
    """
    Função geradora para fornecer uma sessão de banco de dados por requisição.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()