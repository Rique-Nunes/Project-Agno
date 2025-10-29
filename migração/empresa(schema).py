from pydantic import BaseModel
from typing import Optional

class EmpresaBase(BaseModel):
    name: str
    url_zabbix: str
    usuario_zabbix: str

class EmpresaCreate(EmpresaBase):
    token_zabbix: str

class EmpresaUpdate(BaseModel):
    name: Optional[str] = None
    url_zabbix: Optional[str] = None
    usuario_zabbix: Optional[str] = None
    token_zabbix: Optional[str] = None

class EmpresaResponse(EmpresaBase):
    id: int

    class Config:
        from_attributes = True

class EmpresaDetails(EmpresaBase):
    id: int
    token_zabbix: str

class EmpresaDetails(EmpresaBase):
    id: int
    token_zabbix: str
# Schema para retornar os detalhes completos (informações privadas).
class EmpresaDetails(EmpresaResponse):
    token_zabbix: str # Token já descriptografado