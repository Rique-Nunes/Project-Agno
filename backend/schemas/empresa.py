from pydantic import BaseModel
from typing import Optional

# Schema para a criação de uma empresa.
class EmpresaCreate(BaseModel):
    nome: str
    url_zabbix: str
    usuario_zabbix: str # CAMPO ADICIONADO
    token_zabbix: str

# Schema para a resposta ao listar empresas (informações públicas).
class EmpresaResponse(BaseModel):
    id: int
    nome: str
    url_zabbix: str # CAMPO ADICIONADO
    usuario_zabbix: str # CAMPO ADICIONADO

    class Config:
        from_attributes = True

# Schema para retornar os detalhes completos (informações privadas).
class EmpresaDetails(EmpresaResponse):
    token_zabbix: str # Token já descriptografado