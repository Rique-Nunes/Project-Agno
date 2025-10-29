from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.connection import get_db
from schemas.usuario import Usuario, UsuarioUpdateRole
from schemas.roles import UserRole
from crud import usuario as crud_usuario
from crud import empresa as crud_empresa # Importar o CRUD de empresa
from utils.security import require_role

router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"],
    # --- Alteração na Permissão ---
    dependencies=[Depends(require_role(UserRole.SUPER_ADMIN))] 
)

@router.get("/", response_model=List[Usuario])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retorna uma lista de todos os usuários.
    Apenas para Admins ou superior.
    """
    users = crud_usuario.get_usuarios(db, skip=skip, limit=limit)
    return users

@router.put("/{user_id}/role", response_model=Usuario)
def update_user_role_endpoint(user_id: int, user_update: UsuarioUpdateRole, db: Session = Depends(get_db)):
    """
    Atualiza o papel de um usuário específico.
    Apenas para Admins ou superior.
    """
    db_user = crud_usuario.update_user_role(db, user_id=user_id, new_role=user_update.role)
    if db_user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return db_user

# --- NOVO ENDPOINT DE ASSOCIAÇÃO ---

@router.post("/{user_id}/empresas/{empresa_id}", response_model=Usuario)
def associate_user_to_empresa(user_id: int, empresa_id: int, db: Session = Depends(get_db)):
    """
    Associa um usuário a uma empresa.
    Apenas para Admins ou superior.
    """
    # Verifica se o usuário e a empresa existem
    db_user = crud_usuario.get_usuario_by_id(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    db_empresa = crud_empresa.get_empresa_by_id(db, empresa_id=empresa_id)
    if not db_empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
        
    # Chama a função CRUD para criar a associação
    updated_user = crud_usuario.associate_user_with_empresa(db, user=db_user, empresa=db_empresa)
    return updated_user

# --- NOVO ENDPOINT DE REMOÇÃO ---
@router.delete("/{user_id}/empresas/{empresa_id}", response_model=Usuario)
def disassociate_user_from_empresa(user_id: int, empresa_id: int, db: Session = Depends(get_db)):
    """
    Remove a associação de um usuário com uma empresa.
    Apenas para Admins ou superior.
    """
    db_user = crud_usuario.get_usuario_by_id(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    db_empresa = crud_empresa.get_empresa_by_id(db, empresa_id=empresa_id)
    if not db_empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
        
    updated_user = crud_usuario.disassociate_user_from_empresa(db, user=db_user, empresa=db_empresa)
    return updated_user