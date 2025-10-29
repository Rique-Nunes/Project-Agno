from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from schemas.empresa import EmpresaResponse, EmpresaCreate
from crud import empresa as crud_empresa
from database.connection import get_db
from utils.security import require_role
from schemas.roles import UserRole

router = APIRouter(
    prefix="/empresas", 
    tags=["Empresas"],
    dependencies=[Depends(require_role(UserRole.ADMIN))]
)


@router.get("/", response_model=List[EmpresaResponse])
def read_empresas(db: Session = Depends(get_db)):
    return crud_empresa.get_empresas(db=db)


@router.post("/", response_model=EmpresaResponse)
def create_empresa(empresa: EmpresaCreate, db: Session = Depends(get_db)):
    return crud_empresa.create_empresa(db=db, empresa=empresa)

@router.get("/{empresa_id}", response_model=EmpresaResponse)
def read_empresa_details(
    empresa_id: int,
    db: Session = Depends(get_db) # <<-- CORREÇÃO AQUI (era get_d)
):
    db_empresa = crud_empresa.get_empresa_by_id(db, empresa_id=empresa_id)
    if db_empresa is None:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return db_empresa

@router.delete("/{empresa_id}", response_model=EmpresaResponse)
def delete_empresa_endpoint(
    empresa_id: int,
    db: Session = Depends(get_db)
):
    db_empresa = crud_empresa.delete_empresa(db, empresa_id=empresa_id)
    if db_empresa is None:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    return db_empresa