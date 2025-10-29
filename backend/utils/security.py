from cryptography.fernet import Fernet
import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
from schemas.roles import UserRole, ROLE_HIERARCHY

# --- Importações adicionais para a nova dependência ---
from sqlalchemy.orm import Session
from database.connection import get_db
from crud import usuario as crud_usuario

# --- Criptografia Fernet (para tokens do Zabbix) ---
KEY_FILE = "encryption.key"

def gerar_e_salvar_chave():
    key = Fernet.generate_key()
    with open(KEY_FILE, "wb") as key_file:
        key_file.write(key)
    print(f"Chave de criptografia gerada e salva em '{KEY_FILE}'. Mantenha este arquivo seguro!")
    return key

def carregar_chave():
    if not os.path.exists(KEY_FILE):
        return gerar_e_salvar_chave()
    
    with open(KEY_FILE, "rb") as key_file:
        return key_file.read()

CHAVE_FERNET = carregar_chave()
fernet = Fernet(CHAVE_FERNET)

def criptografar_token(token: str) -> str:
    token_bytes = token.encode('utf-8')
    token_criptografado_bytes = fernet.encrypt(token_bytes)
    return token_criptografado_bytes.decode('utf-8')

def descriptografar_token(token_criptografado: str) -> str:
    token_criptografado_bytes = token_criptografado.encode('utf-8')
    token_descriptografado_bytes = fernet.decrypt(token_criptografado_bytes)
    return token_descriptografado_bytes.decode('utf-8')

# --- Validação de JWT (para autenticação de usuário) ---

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    raise ValueError("Variável de ambiente JWT_SECRET_KEY não definida. Isso é crítico para a segurança.")

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
if not GOOGLE_CLIENT_ID:
    raise ValueError("Variável de ambiente GOOGLE_CLIENT_ID não definida.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 dias

security_scheme = HTTPBearer()

class TokenData(BaseModel):
    sub: str | None = None
    user_id: int | None = None
    role: UserRole | None = None
    empresas: list[int] | None = None

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security_scheme)) -> TokenData:
    token = credentials.credentials
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        subject: str = payload.get("sub")
        user_id: int = payload.get("user_id")
        role: str = payload.get("role")
        empresas: list[int] = payload.get("empresas", [])

        if subject is None or user_id is None or role is None:
            raise credentials_exception

        token_data = TokenData(sub=subject, user_id=user_id, role=UserRole(role), empresas=empresas)
        
    except (JWTError, ValueError) as e:
        print(f"\nERRO DE JWT OU PAPEL INVÁLIDO: {e}\n")
        raise credentials_exception
    
    return token_data

# --- FUNÇÃO DE AUTORIZAÇÃO POR PAPEL ---
def require_role(minimum_role: UserRole):
    def dependency(current_user: TokenData = Depends(get_current_user)):
        required_level = ROLE_HIERARCHY.get(minimum_role)
        user_level = ROLE_HIERARCHY.get(current_user.role)

        if not user_level or user_level < required_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado. Requer o nível de permissão '{minimum_role.value}' ou superior."
            )
        return current_user
    return dependency

# --- NOVA DEPENDÊNCIA DE AUTORIZAÇÃO MULTI-TENANT ---
def require_empresa_access(empresa_id: int, db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_user)):
    """
    Dependência que verifica se o usuário logado tem acesso à empresa_id solicitada.
    """
    user = crud_usuario.get_usuario_by_id(db, user_id=current_user.user_id)

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário do token não encontrado.")

    allowed_empresa_ids = {empresa.id for empresa in user.empresas}

    if empresa_id not in allowed_empresa_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado a esta empresa."
        )
    
    return user