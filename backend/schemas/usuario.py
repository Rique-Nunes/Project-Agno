from pydantic import BaseModel, EmailStr
from typing import Optional, List
from .roles import UserRole
from .empresa import EmpresaResponse

# --- NOVO SUB-SCHEMA ---
# Define uma estrutura mínima para a empresa quando ela for parte de outro objeto.
class _EmpresaInUsuario(BaseModel):
    id: int
    nome: str

    class Config:
        from_attributes = True


class UsuarioBase(BaseModel):
    email: EmailStr
    nome: str
    role: UserRole = UserRole.VIEWER
    telefone: Optional[str] = None
    cargo: Optional[str] = None
    idioma_ia: Optional[str] = None

class UsuarioCreate(UsuarioBase):
    pass

class UsuarioUpdate(BaseModel):
    nome: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    telefone: Optional[str] = None
    cargo: Optional[str] = None
    idioma_ia: Optional[str] = None

class Usuario(UsuarioBase):
    id: int
    role: UserRole
    empresas: List[EmpresaResponse] = []

    class Config:
        from_attributes = True

class UsuarioUpdateRole(BaseModel):
    role: UserRole