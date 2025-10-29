from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from services.gemini_service import GeminiService
from llm.prompts import PromptBuilder
from utils.security import get_current_user, TokenData, require_role
from schemas.roles import UserRole

# Define o router com prefixo e tags
router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
    dependencies=[Depends(require_role(UserRole.OPERATOR))]
)

class ChatRequest(BaseModel):
    question: str
    empresa_id: int

# --- CORREÇÃO APLICADA AQUI ---
# Instanciamos o PromptBuilder e o GeminiService da forma correta,
# garantindo que o serviço tenha acesso ao construtor de prompts.
prompt_builder = PromptBuilder()
gemini_service = GeminiService(prompt_builder)


@router.post("/")
async def chat_with_gemini(
    request: ChatRequest, 
    current_user: TokenData = Depends(get_current_user)
):
    try:
        result = gemini_service.process_user_question(
            question=request.question,
            empresa_id=request.empresa_id
        )
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        # Adiciona um log de erro no console do backend para facilitar o debug
        print(f"Erro na rota /chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))