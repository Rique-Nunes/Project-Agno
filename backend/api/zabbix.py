from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
# --- CORREÇÃO AQUI ---
from typing import List, Optional 
from api.empresas import get_db
from crud.empresa import get_empresa_by_id
from utils.security import descriptografar_token, require_empresa_access, TokenData
from services import zabbix_service
import time

router = APIRouter(prefix="/zabbix", tags=["Zabbix"])

def get_zabbix_credentials(empresa_id: int, db: Session):
    db_empresa = get_empresa_by_id(db, empresa_id=empresa_id)
    if not db_empresa:
        raise HTTPException(status_code=404, detail="Empresa não encontrada")
    token_zabbix = descriptografar_token(db_empresa.token_zabbix_criptografado)
    return db_empresa.url_zabbix, token_zabbix

@router.get("/hosts/{empresa_id}")
def read_zabbix_hosts(empresa_id: int, db: Session = Depends(get_db), user_with_access = Depends(require_empresa_access)):
    try:
        api_url, token_zabbix = get_zabbix_credentials(empresa_id, db)
        return zabbix_service.get_zabbix_hosts(api_url=api_url, token=token_zabbix)
    except zabbix_service.ZabbixAPIException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/history/aggregated/{empresa_id}")
def read_aggregated_history(
    empresa_id: int,
    period: str = Query("24h", regex="^(24h|7d|30d)$"),
    db: Session = Depends(get_db),
    user_with_access = Depends(require_empresa_access)
):
    try:
        api_url, token_zabbix = get_zabbix_credentials(empresa_id, db)
        return zabbix_service.get_aggregated_history(
            api_url=api_url, token=token_zabbix, period=period
        )
    except zabbix_service.ZabbixAPIException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {e}")

@router.get("/metrics/top_consumers/{empresa_id}")
def read_top_consumers(
    empresa_id: int,
    db: Session = Depends(get_db),
    user_with_access = Depends(require_empresa_access)
):
    try:
        api_url, token_zabbix = get_zabbix_credentials(empresa_id, db)
        return zabbix_service.get_top_consumers(api_url=api_url, token=token_zabbix)
    except zabbix_service.ZabbixAPIException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {e}")

@router.get("/context/full/{empresa_id}")
def read_full_context(
    empresa_id: int,
    db: Session = Depends(get_db),
    user_with_access = Depends(require_empresa_access)
):
    try:
        api_url, token_zabbix = get_zabbix_credentials(empresa_id, db)
        return zabbix_service.get_full_zabbix_context(api_url=api_url, token=token_zabbix)
    except zabbix_service.ZabbixAPIException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor: {e}")
                        
@router.get("/metrics/key_metrics/{empresa_id}/{host_id}")
def read_key_metrics(empresa_id: int, host_id: str, db: Session = Depends(get_db), user_with_access = Depends(require_empresa_access)):
    try:
        api_url, token_zabbix = get_zabbix_credentials(empresa_id, db)
        return zabbix_service.get_key_metrics(api_url=api_url, token=token_zabbix, host_id=host_id)
    except zabbix_service.ZabbixAPIException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/alerts/critical/{empresa_id}")
def read_critical_alerts(empresa_id: int, db: Session = Depends(get_db), user_with_access = Depends(require_empresa_access)):
    try:
        api_url, token_zabbix = get_zabbix_credentials(empresa_id, db)
        return zabbix_service.get_active_triggers(api_url=api_url, token=token_zabbix)
    except zabbix_service.ZabbixAPIException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/triggers/host/{empresa_id}/{host_id}")
def read_host_triggers(empresa_id: int, host_id: str, db: Session = Depends(get_db), user_with_access = Depends(require_empresa_access)):
    """Retorna triggers ativos e inativos de um host específico"""
    try:
        api_url, token_zabbix = get_zabbix_credentials(empresa_id, db)
        return zabbix_service.get_host_triggers(api_url=api_url, token=token_zabbix, host_id=host_id)
    except zabbix_service.ZabbixAPIException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/host/info/{empresa_id}/{host_id}")
def read_host_info(empresa_id: int, host_id: str, db: Session = Depends(get_db), user_with_access = Depends(require_empresa_access)):
    """Retorna informações do sistema do host"""
    try:
        api_url, token_zabbix = get_zabbix_credentials(empresa_id, db)
        return zabbix_service.get_host_system_info(api_url=api_url, token=token_zabbix, host_id=host_id)
    except zabbix_service.ZabbixAPIException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/alerts/history/{empresa_id}")
def read_alert_history(
    empresa_id: int,
    db: Session = Depends(get_db),
    time_from: Optional[int] = None,
    time_till: Optional[int] = None,
    hostids: Optional[List[str]] = Query(None),
    user_with_access = Depends(require_empresa_access)
):
    try:
        api_url, token_zabbix = get_zabbix_credentials(empresa_id, db)
        
        if time_till is None: time_till = int(time.time())
        if time_from is None: time_from = time_till - (24 * 60 * 60)
        
        return zabbix_service.get_alert_history(
            api_url=api_url, token=token_zabbix,
            time_from=time_from, time_till=time_till, hostids=hostids
        )
    except zabbix_service.ZabbixAPIException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/events/log/{empresa_id}")
def read_event_log(
    empresa_id: int,
    db: Session = Depends(get_db),
    time_from: Optional[int] = None,
    time_till: Optional[int] = None,
    hostids: Optional[List[str]] = Query(None),
    user_with_access = Depends(require_empresa_access)
):
    try:
        api_url, token_zabbix = get_zabbix_credentials(empresa_id, db)
        if time_till is None: time_till = int(time.time())
        if time_from is None: time_from = time_till - (24 * 60 * 60)
        
        return zabbix_service.get_event_log(
            api_url=api_url, token=token_zabbix,
            time_from=time_from, time_till=time_till, hostids=hostids
        )
    except zabbix_service.ZabbixAPIException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/inventory/{empresa_id}")
def read_inventory(
    empresa_id: int,
    filter: Optional[str] = Query(None),
    includeHeavy: bool = Query(False),
    db: Session = Depends(get_db),
    user_with_access = Depends(require_empresa_access)
):
    try:
        api_url, token_zabbix = get_zabbix_credentials(empresa_id, db)
        return zabbix_service.get_company_inventory(
            api_url=api_url, token=token_zabbix, filter_text=filter, include_heavy=includeHeavy
        )
    except zabbix_service.ZabbixAPIException as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/inventory/{empresa_id}")
def read_inventory(
    empresa_id: int,
    filter: Optional[str] = Query(None),
    includeHeavy: bool = Query(False),
    db: Session = Depends(get_db),
    user_with_access = Depends(require_empresa_access)
):
    try:
        api_url, token_zabbix = get_zabbix_credentials(empresa_id, db)
        return zabbix_service.get_company_inventory(
            api_url=api_url, token=token_zabbix, filter_text=filter, include_heavy=includeHeavy
        )
    except zabbix_service.ZabbixAPIException as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/inventory/{empresa_id}/pdf")
def download_inventory_pdf(
    empresa_id: int,
    filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user_with_access = Depends(require_empresa_access)
):
    """
    Gera um PDF do inventário de hosts e retorna como download.
    """
    try:
        from io import BytesIO
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.styles import getSampleStyleSheet

        api_url, token_zabbix = get_zabbix_credentials(empresa_id, db)
        data = zabbix_service.get_company_inventory(api_url=api_url, token=token_zabbix, filter_text=filter, include_heavy=True) # Heavy para o PDF

        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), leftMargin=20, rightMargin=20, topMargin=20, bottomMargin=20)
        elements = []
        styles = getSampleStyleSheet()

        title = Paragraph(f"Inventário de Hosts - Empresa ID: {empresa_id}", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 12))

        headers = [
            # --- CORREÇÃO AQUI: Adicionando as colunas que faltavam ---
            "Host", "Nome", "Status", "IP(s)", "Grupos", "Templates", 
            "OS", "Modelo", "Vendor", "Localização", "Responsável"
        ]
        rows = [headers]
        for r in data:
            ips = ", ".join([i.get('ip') for i in (r.get('interfaces') or []) if i.get('ip')])
            groups = "; ".join(r.get('groups', []))
            templates = "; ".join(r.get('templates', []))
            inv = r.get('inventory') or {}
            row = [
                r.get('host', ''),
                r.get('name', ''),
                'Habilitado' if int(r.get('status', 1)) == 0 else 'Desabilitado',
                ips,
                groups,
                templates,
                inv.get('os_full', ''),
                inv.get('model', ''),
                inv.get('vendor', ''),
                # --- CORREÇÃO AQUI: Adicionando os dados das novas colunas ---
                inv.get('location', ''),
                inv.get('contact', '')
            ]
            rows.append(row)

        table = Table(rows, repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.lightgrey),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
            ('FONTSIZE', (0,0), (-1,-1), 8),
            ('GRID', (0,0), (-1,-1), 0.25, colors.grey),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        elements.append(table)

        doc.build(elements)
        buffer.seek(0)
        
        from fastapi.responses import StreamingResponse
        return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=inventario-hosts.pdf"})

    except zabbix_service.ZabbixAPIException as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ImportError:
        raise HTTPException(status_code=500, detail="A biblioteca 'reportlab' não está instalada no servidor.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro interno do servidor ao gerar PDF: {e}")