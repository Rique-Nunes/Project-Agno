from sqlalchemy.orm import Session
from database.models import Empresa as EmpresaModel
from schemas.empresa import EmpresaCreate, EmpresaUpdate
from utils.security import criptografar_token

def get_empresa_by_id(db: Session, empresa_id: int):
    return db.query(EmpresaModel).filter(EmpresaModel.id == empresa_id).first()

def get_empresas(db: Session, skip: int = 0, limit: int = 100):
    return db.query(EmpresaModel).offset(skip).limit(limit).all()

def create_empresa(db: Session, empresa: EmpresaCreate):
    token_criptografado = criptografar_token(empresa.token_zabbix)
    db_empresa = EmpresaModel(
        nome=empresa.nome,
        url_zabbix=empresa.url_zabbix,
        usuario_zabbix=empresa.usuario_zabbix,
        token_zabbix_criptografado=token_criptografado
    )
    db.add(db_empresa)
    db.commit()
    db.refresh(db_empresa)
    return db_empresa

def update_empresa(db: Session, empresa_id: int, empresa_update: EmpresaUpdate):
    db_empresa = get_empresa_by_id(db, empresa_id)
    if not db_empresa:
        return None

    update_data = empresa_update.model_dump(exclude_unset=True)
    
    if "token_zabbix" in update_data and update_data["token_zabbix"]:
        token_criptografado = criptografar_token(update_data["token_zabbix"])
        db_empresa.token_zabbix_criptografado = token_criptografado
        del update_data["token_zabbix"]

    for key, value in update_data.items():
        setattr(db_empresa, key, value)

    db.commit()
    db.refresh(db_empresa)
    return db_empresa

def delete_empresa(db: Session, empresa_id: int):
    db_empresa = db.query(EmpresaModel).filter(EmpresaModel.id == empresa_id).first()
    if db_empresa:
        db.delete(db_empresa)
        db.commit()
    return db_empresa