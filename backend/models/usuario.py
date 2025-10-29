from sqlalchemy import Column, Integer, String, Enum, Table
from sqlalchemy.orm import relationship
from database.connection import Base
from database.models import usuario_empresa_association
from schemas.roles import UserRole

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String, unique=True, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    nome = Column(String)
    telefone = Column(String, nullable=True)
    cargo = Column(String, nullable=True)
    idioma_ia = Column(String, nullable=True, default='portugues')
    role = Column(Enum(UserRole), default=UserRole.VIEWER, nullable=False)
    
    empresas = relationship(
        "Empresa",
        secondary=usuario_empresa_association,
        back_populates="usuarios",
        lazy="joined"
    )