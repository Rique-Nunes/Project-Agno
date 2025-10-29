from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from utils.security import create_access_token, GOOGLE_CLIENT_ID
from crud.usuario import get_or_create_user
from api.empresas import get_db
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

router = APIRouter(prefix="/auth", tags=["Authentication"])

class GoogleToken(BaseModel):
    token: str

@router.post("/token")
async def google_login(google_token: GoogleToken, db: Session = Depends(get_db)):
    """
    Recebe um ID Token do Google, valida-o e, em caso de sucesso,
    retorna um token JWT interno da aplicação.
    """
    try:
        idinfo = id_token.verify_oauth2_token(
            google_token.token, 
            google_requests.Request(), 
            GOOGLE_CLIENT_ID
        )

        user_id = idinfo['sub']
        user_email = idinfo['email']
        user_name = idinfo.get('name', '')
        # A linha abaixo pode ser removida
        # user_picture = idinfo.get('picture', '')

        db_user = get_or_create_user(
            db, 
            google_id=user_id, 
            email=user_email, 
            nome=user_name
            # O argumento 'picture' foi removido
        )

        # --- ALTERAÇÃO AQUI ---
        # Adicionamos o 'user_id' e o 'role' ao payload do token.
        access_token = create_access_token(
            data={"sub": db_user.email, "user_id": db_user.id, "role": db_user.role.value}
        )
        
        return {"access_token": access_token, "token_type": "bearer"}

    except ValueError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Token do Google inválido: {e}",
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno no servidor durante a autenticação: {e}"
        )