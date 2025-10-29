from sqlalchemy import Column, Integer, String, Table, ForeignKey
from sqlalchemy.orm import relationship
from .connection import Base

# --- NOVA TABELA DE ASSOCIAÇÃO ---
# Esta tabela não é um modelo (não tem uma classe), pois ela apenas
# conecta dois outros modelos. SQLAlchemy gerencia isso automaticamente.
usuario_empresa_association = Table('usuario_empresa_association', Base.metadata,
    Column('usuario_id', Integer, ForeignKey('usuarios.id'), primary_key=True),
    Column('empresa_id', Integer, ForeignKey('empresas.id'), primary_key=True)
)

class Empresa(Base):
    __tablename__ = "empresas"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, index=True, nullable=False)
    url_zabbix = Column(String, nullable=False)
    usuario_zabbix = Column(String, nullable=False) # CAMPO ADICIONADO
    # O token será armazenado em formato de bytes criptografados, que o SQLAlchemy
    # trata como String. Nunca armazene o token em texto plano.
    token_zabbix_criptografado = Column(String, nullable=False)

    # --- NOVO RELACIONAMENTO ---
    # Define a relação "muitos-para-muitos" com a classe Usuario,
    # usando a tabela de associação que criamos acima.
    usuarios = relationship(
        "Usuario",
        secondary=usuario_empresa_association,
        back_populates="empresas"
    )