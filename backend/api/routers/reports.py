from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.connection import get_db
from services.report_service import ReportService
from services.zabbix_service import ZabbixAPIException
# Importa a segurança básica e o CRUD de usuário
from utils.security import TokenData, get_current_user 
from schemas.report import ReportRequest, ReportResponse
from crud import usuario as crud_usuario

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.post("/generate", response_model=ReportResponse)
async def generate_comprehensive_report(
    request: ReportRequest, # O corpo da requisição agora contém o empresa_id
    db: Session = Depends(get_db),
    # 1. Obtemos o usuário logado a partir do token
    current_user: TokenData = Depends(get_current_user)
):
    """
    Gera um relatório completo baseado na consulta do usuário usando IA.
    Esta rota é protegida e garante que o usuário pertence à empresa solicitada.
    """
    # 2. Verificação de segurança manual
    # Buscamos o usuário no banco para verificar suas empresas associadas
    user_from_db = crud_usuario.get_usuario_by_id(db, user_id=current_user.user_id)
    if not user_from_db:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuário do token não encontrado.")
    
    # Criamos um conjunto (set) com os IDs das empresas que o usuário pode acessar
    allowed_empresa_ids = {empresa.id for empresa in user_from_db.empresas}

    # Verificamos se a empresa solicitada no corpo da requisição está na lista de empresas permitidas
    if request.empresa_id not in allowed_empresa_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado a esta empresa."
        )

    # 3. Se a verificação passar, a lógica de negócio continua
    try:
        report_service = ReportService()
        report_result = report_service.generate_comprehensive_report(
            empresa_id=request.empresa_id,
            user_query=request.user_query,
            host_id=request.host_id,
            period=request.period,
            db=db
        )
        return report_result

    except ZabbixAPIException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {str(e)}")
