from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from api.empresas import get_db
from crud.empresa import get_empresa_by_id
from utils.security import get_current_user, TokenData, descriptografar_token
from services import zabbix_service
from services.report_service import ReportService
import time
from typing import Optional

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

@router.post("/generate", response_model=ReportResponse)
async def generate_comprehensive_report(
    request: ReportRequest,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Gera um relatório completo e profissional para análise de infraestrutura.
    Inclui dados do host, métricas, alertas e análise da IA.
    """
    try:
        api_url, token_zabbix = get_zabbix_credentials(request.empresa_id, db)
        
        # Buscar dados do host específico
        host_info = zabbix_service.get_host_system_info(
            api_url=api_url, token=token_zabbix, host_id=request.host_id
        )
        
        # Buscar métricas atuais
        current_metrics = zabbix_service.get_key_metrics(
            api_url=api_url, token=token_zabbix, host_id=request.host_id
        )
        
        # Buscar triggers do host
        host_triggers = zabbix_service.get_host_triggers(
            api_url=api_url, token=token_zabbix, host_id=request.host_id
        )
        
        # Buscar dados históricos
        days = 7 if request.period == "7d" else (1 if request.period == "24h" else 30)
        time_till = int(time.time())
        time_from = time_till - (days * 24 * 60 * 60)
        
        alert_history = zabbix_service.get_alert_history(
            api_url=api_url, token=token_zabbix,
            time_from=time_from, time_till=time_till
        )
        
        event_log = zabbix_service.get_event_log(
            api_url=api_url, token=token_zabbix,
            time_from=time_from, time_till=time_till
        )
        
        # Preparar dados estruturados para a IA
        report_data = {
            "host_info": host_info,
            "current_metrics": current_metrics,
            "active_triggers": {
                "critical": host_triggers.get("critical", []),
                "warning": host_triggers.get("warning", []),
                "info": host_triggers.get("info", []),
                "ok": host_triggers.get("ok", [])
            },
            "alert_history": alert_history,
            "event_log": event_log,
            "user_query": request.user_query,
            "period": request.period,
            "report_timestamp": time.time()
        }
        
        # Usar o serviço de relatórios especializado
        report_service = ReportService()
        
        report_result = report_service.generate_comprehensive_report(
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
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {e}")

@router.get("/host/{empresa_id}/{host_id}/quick-summary")
def get_host_quick_summary(
    empresa_id: int,
    host_id: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Retorna um resumo rápido do host para preview antes de gerar relatório completo.
    """
    try:
        api_url, token_zabbix = get_zabbix_credentials(empresa_id, db)
        
        report_service = ReportService()
        summary = report_service.generate_quick_summary(
            api_url=api_url,
            token=token_zabbix,
            host_id=host_id,
            empresa_id=empresa_id
        )
        
        return summary
        
    except zabbix_service.ZabbixAPIException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {e}")

@router.get("/host/{empresa_id}/{host_id}/summary")
def get_host_summary_for_report(
    empresa_id: int,
    host_id: str,
    db: Session = Depends(get_db),
    current_user: TokenData = Depends(get_current_user)
):
    """
    Retorna um resumo completo dos dados do host para relatórios.
    """
    try:
        api_url, token_zabbix = get_zabbix_credentials(empresa_id, db)
        
        # Buscar todos os dados necessários em paralelo
        host_info = zabbix_service.get_host_system_info(
            api_url=api_url, token=token_zabbix, host_id=host_id
        )
        
        metrics = zabbix_service.get_key_metrics(
            api_url=api_url, token=token_zabbix, host_id=host_id
        )
        
        triggers = zabbix_service.get_host_triggers(
            api_url=api_url, token=token_zabbix, host_id=host_id
        )
        
        return {
            "host_info": host_info,
            "metrics": metrics,
            "triggers": triggers,
            "summary_generated_at": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        }
        
    except zabbix_service.ZabbixAPIException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {e}")
