from sqlalchemy.orm import Session
from models.usuario import Usuario
from database.models import Empresa
from schemas.roles import UserRole
from schemas.usuario import UsuarioUpdate

# 1. MAPEAMENTO DE DOMÍNIO PARA EMPRESA
# Mapeia um domínio de e-mail para o ID da empresa no banco de dados.
# Assumindo que o ID da empresa 'IPNET' é 1.
DOMAIN_TO_EMPRESA_ID = {
    "ipnet.cloud": 1
}

def get_or_create_user(db: Session, google_id: str, email: str, nome: str):
    """
    Busca um usuário pelo google_id. Se não existir, cria um novo
    e tenta associá-lo a uma empresa com base no domínio do e-mail.
    """
    db_user = db.query(Usuario).filter(Usuario.google_id == google_id).first()
    
    if not db_user:
        # Usuário não existe, vamos criar um novo
        db_user = Usuario(
            google_id=google_id, 
            email=email, 
            nome=nome, 
            # CORREÇÃO AQUI: Atribuir o Enum diretamente, não a string.
            role=UserRole.VIEWER 
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # --- LÓGICA DE ASSOCIAÇÃO AUTOMÁTICA ---
        try:
            domain = email.split('@')[1]
            empresa_id = DOMAIN_TO_EMPRESA_ID.get(domain)
            
            if empresa_id:
                empresa = db.query(Empresa).filter(Empresa.id == empresa_id).first()
                if empresa:
                    db_user.empresas.append(empresa)
                    db.commit()
                    db.refresh(db_user)
                    print(f"Novo usuário '{email}' associado automaticamente à empresa '{empresa.nome}'.")

        except IndexError:
            print(f"Não foi possível extrair o domínio do e-mail '{email}'.")
            pass

    return db_user

def update_usuario(db: Session, usuario_id: int, usuario_update: UsuarioUpdate):
    """
    Atualiza os detalhes de um usuário (nome, telefone, cargo, idioma_ia).
    """
    db_user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not db_user:
        return None

    update_data = usuario_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_user, key, value)

    db.commit()
    db.refresh(db_user)
    return db_user

def get_usuarios(db: Session, skip: int = 0, limit: int = 100):
    """Retorna uma lista de todos os usuários."""
    return db.query(Usuario).offset(skip).limit(limit).all()

def get_usuario_by_id(db: Session, user_id: int):
    """Retorna um usuário pelo seu ID."""
    return db.query(Usuario).filter(Usuario.id == user_id).first()

def get_usuario_by_email(db: Session, email: str):
    """Retorna um usuário pelo seu e-mail."""
    return db.query(Usuario).filter(Usuario.email == email).first()

def update_user_role(db: Session, user_id: int, new_role: UserRole):
    """Atualiza o papel de um usuário específico."""
    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if db_user:
        db_user.role = new_role
        db.commit()
        db.refresh(db_user)
    return db_user

def associate_user_with_empresa(db: Session, user: Usuario, empresa: Empresa):
    """Adiciona a associação entre um usuário e uma empresa."""
    if empresa not in user.empresas:
        user.empresas.append(empresa)
        db.commit()
        db.refresh(user)
    return user

def disassociate_user_from_empresa(db: Session, user: Usuario, empresa: Empresa):
    """Remove a associação entre um usuário e uma empresa."""
    if empresa in user.empresas:
        user.empresas.remove(empresa)
        db.commit()
        db.refresh(user)
    return user