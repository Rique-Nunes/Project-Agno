from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database.connection import Base

class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, index=True)
    zabbix_url = Column(String)
    zabbix_user = Column(String)
    zabbix_token = Column(String)

    usuarios = relationship("Usuario", back_populates="empresa")
