from cryptography.fernet import Fernet
import os
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel

# --- Criptografia Fernet (para tokens do Zabbix) ---

KEY_FILE = "encryption.key"

def gerar_e_salvar_chave():
    """
    Gera uma nova chave de criptografia e a salva em um arquivo.
    """
    key = Fernet.generate_key()
    with open(KEY_FILE, "wb") as key_file:
        key_file.write(key)
    print(f"Chave de criptografia gerada e salva em '{KEY_FILE}'. Mantenha este arquivo seguro!")
    return key

def carregar_chave():
    """
    Carrega a chave de criptografia do arquivo. Se o arquivo não existir,
    gera uma nova chave.
    """
    if not os.path.exists(KEY_FILE):
        return gerar_e_salvar_chave()
    
    with open(KEY_FILE, "rb") as key_file:
        return key_file.read()

CHAVE_FERNET = carregar_chave()
fernet = Fernet(CHAVE_FERNET)

def criptografar_token(token: str) -> str:
    """Criptografa um token (string) e retorna como uma string."""
    token_bytes = token.encode('utf-8')
    token_criptografado_bytes = fernet.encrypt(token_bytes)
    return token_criptografado_bytes.decode('utf-8')

def descriptografar_token(token_criptografado: str) -> str:
    """Descriptografa um token (string) e retorna a string original."""
    token_criptografado_bytes = token_criptografado.encode('utf-8')
    token_descriptografado_bytes = fernet.decrypt(token_criptografado_bytes)
    return token_descriptografado_bytes.decode('utf-8')

# --- Validação de JWT (para autenticação de usuário) ---

NEXTAUTH_SECRET = os.getenv("NEXTAUTH_SECRET", "chave_padrao_insegura")
if NEXTAUTH_SECRET == "chave_padrao_insegura":
    print("\n⚠️ AVISO: Variável de ambiente NEXTAUTH_SECRET não definida. Usando valor padrão. ISSO NÃO É SEGURO PARA PRODUÇÃO.\n")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class TokenData(BaseModel):
    email: str | None = None

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """
    Dependência para validar o token JWT e retornar os dados do usuário.
    Esta função foi aprimorada para ser mais explícita com os algoritmos.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Adicione um print para depurar o token recebido
        print("\n--- DEBUG: TOKEN RECEBIDO ---")
        print(token)
        print("--- FIM DEBUG ---\n")

        # O NextAuth v4 usa HS512 por padrão para JWTs de sessão.
        # Listamos múltiplos algoritmos para garantir a compatibilidade.
        payload = jwt.decode(
            token, 
            NEXTAUTH_SECRET, 
            algorithms=["HS256", "HS384", "HS512"]
        )
        email: str = payload.get("email")
        
        if email is None:
            # Fallback para a claim 'sub' (subject), que também pode conter o email.
            email = payload.get("sub")
            if email is None:
              raise credentials_exception

        token_data = TokenData(email=email)
        
    except JWTError as e:
        print(f"\nERRO DE JWT: {e}\n") # Imprime o erro exato da decodificação
        raise credentials_exception
    
    return token_data