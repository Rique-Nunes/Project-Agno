from sqlalchemy.orm import Session
from database import models
from schemas.empresa import EmpresaCreate
from utils.security import criptografar_token

def get_empresas(db: Session):
    """Retorna uma lista de todas as empresas."""
    return db.query(models.Empresa).all()

def create_empresa(db: Session, empresa: EmpresaCreate):
    """Cria uma nova empresa no banco de dados."""
    token_criptografado = criptografar_token(empresa.token_zabbix)
    
    db_empresa = models.Empresa(
        nome=empresa.nome,
        url_zabbix=empresa.url_zabbix,
        usuario_zabbix=empresa.usuario_zabbix,
        token_zabbix_criptografado=token_criptografado
    )
    
    db.add(db_empresa)
    db.commit()
    db.refresh(db_empresa)
    return db_empresa

def get_empresa_by_id(db: Session, empresa_id: int):
    """Busca uma empresa pelo seu ID."""
    return db.query(models.Empresa).filter(models.Empresa.id == empresa_id).first()

# --- NOVA FUNÇÃO PARA DELETAR ---
def delete_empresa(db: Session, empresa_id: int):
    """Deleta uma empresa do banco de dados pelo seu ID."""
    db_empresa = db.query(models.Empresa).filter(models.Empresa.id == empresa_id).first()
    if db_empresa:
        db.delete(db_empresa)
        db.commit()
    return db_empresa