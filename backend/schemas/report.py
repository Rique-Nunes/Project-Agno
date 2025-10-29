from pydantic import BaseModel
from typing import Optional, Dict, Any

class ReportRequest(BaseModel):
    empresa_id: int # Mantido aqui para alinhar com o frontend
    user_query: str
    host_id: Optional[str] = None
    period: Optional[str] = "7d"

class ReportResponse(BaseModel):
    report_content: str
    host_info: Dict[str, Any]
    metrics: Dict[str, Any]
    triggers: Dict[str, Any]
    generated_at: str
    period_analyzed: str
    user_query: str
    data_quality: Dict[str, Any]