from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database.connection import get_db 
from crud.empresa import get_empresa_by_id
from utils.security import get_current_user, TokenData, descriptografar_token, require_empresa_access
from services import zabbix_service, report_service
import time
from typing import Optional, List
from collections import defaultdict

router = APIRouter(prefix="/reports", tags=["Reports"])

class ReportRequest(BaseModel):
    host_id: str
    empresa_id: int
    user_query: str
    period: Optional[str] = "7d"

class ReportResponse(BaseModel):
    report_content: str
    host_info: dict
    metrics: dict
    triggers: dict
    generated_at: str

def get_zabbix_credentials(empresa_id: int, db: Session):
    db_empresa = get_empresa_by_id(db, empresa_id=empresa_id)
    if not db_empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    token_zabbix = descriptografar_token(db_empresa.token_zabbix_criptografado)
    return db_empresa.url_zabbix, token_zabbix

@router.post("/generate")
async def generate_comprehensive_report(
    request: ReportRequest,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Gera um relatório completo e profissional para análise de infraestrutura.
    """
    try:
        require_empresa_access(empresa_id=request.empresa_id, db=db, current_user=current_user)

        api_url, token_zabbix = get_zabbix_credentials(request.empresa_id, db)
        
        report_gen_service = report_service.ReportService()
        
        report_result = report_gen_service.generate_comprehensive_report(
            api_url=api_url,
            token=token_zabbix,
            host_id=request.host_id,
            user_query=request.user_query,
            empresa_id=request.empresa_id,
            period=request.period
        )
        
        return ReportResponse(
            report_content=report_result["report_content"],
            host_info=report_result["host_info"],
            metrics=report_result["metrics"],
            triggers=report_result["triggers"],
            generated_at=report_result["generated_at"]
        )
        
    except zabbix_service.ZabbixAPIException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Para debug, é útil logar o erro completo no servidor
        print(f"Erro inesperado em generate_comprehensive_report: {e}")
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {e}")