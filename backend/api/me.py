from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.connection import get_db
from schemas.empresa import EmpresaResponse
from schemas.usuario import Usuario, UsuarioUpdate
from utils.security import get_current_user, TokenData
import crud.usuario as crud_usuario

router = APIRouter(
    prefix="/me",
    tags=["me"],
    responses={404: {"description": "Not found"}},
)

@router.get("", response_model=Usuario)
def read_me(
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Retorna os detalhes completos do usuário logado.
    """
    user = crud_usuario.get_usuario_by_id(db, user_id=current_user.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

@router.patch("", response_model=Usuario)
def update_me(
    usuario_update: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    user_id = current_user.user_id
    updated_user = crud_usuario.update_usuario(db, usuario_id=user_id, usuario_update=usuario_update)
    if not updated_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return updated_user

@router.get("/empresas", response_model=List[EmpresaResponse])
def read_my_empresas(
    db: Session = Depends(get_db), 
    current_user: TokenData = Depends(get_current_user)
):
    """
    Retorna a lista de empresas associadas ao usuário logado.
    """
    user = crud_usuario.get_usuario_by_id(db, user_id=current_user.user_id)
    if not user:
        return []
    
    return user.empresas