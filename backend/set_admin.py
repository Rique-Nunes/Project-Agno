from dotenv import load_dotenv
load_dotenv()

import sys
from sqlalchemy.orm import Session
from database.connection import SessionLocal
from crud import usuario as crud_usuario
from crud import empresa as crud_empresa # 1. Importar o CRUD de empresa
from schemas.roles import UserRole

# Mapeia o número recebido como argumento para a permissão correta
ROLE_MAP = {
    "1": UserRole.VIEWER,
    "2": UserRole.OPERATOR,
    "3": UserRole.ADMIN,
    "4": UserRole.SUPER_ADMIN,
}

def set_user_role_and_associate_empresa(db: Session, user_id: int, new_role: UserRole, empresa_id: int):
    """
    Encontra um usuário pelo ID, atualiza seu papel e o associa a uma empresa.
    """
    user = crud_usuario.get_usuario_by_id(db, user_id=user_id)
    
    if not user:
        print(f"Erro: Usuário com ID '{user_id}' não encontrado.")
        return

    # 2. Atualizar a permissão do usuário
    updated_user = crud_usuario.update_user_role(db, user_id=user.id, new_role=new_role)
    
    if updated_user and updated_user.role == new_role:
        print(f"Sucesso! Permissão do usuário '{updated_user.email}' (ID: {user_id}) alterada para {new_role.value.upper()}.")
    else:
        print(f"Ocorreu um erro ou o usuário já possuía a permissão '{new_role.value}'.")

    # 3. Associar o usuário à empresa
    empresa = crud_empresa.get_empresa_by_id(db, empresa_id=empresa_id)
    if not empresa:
        print(f"Erro: Empresa com ID '{empresa_id}' não encontrada. A associação falhou.")
        return

    # Verifica se a associação já existe antes de adicionar
    if empresa in updated_user.empresas:
        print(f"O usuário '{updated_user.email}' já está associado à empresa '{empresa.nome}'.")
    else:
        crud_usuario.associate_user_with_empresa(db, user=updated_user, empresa=empresa)
        print(f"Sucesso! Usuário '{updated_user.email}' associado à empresa '{empresa.nome}'.")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Uso: python3 set_admin.py <user_id> <role_number>")
        print("\nNúmeros das Permissões:")
        print("  1: Viewer")
        print("  2: Operator")
        print("  3: Admin")
        print("  4: Super Admin")
        sys.exit(1)

    try:
        user_id_to_change = int(sys.argv[1])
    except ValueError:
        print(f"Erro: O ID do usuário ('{sys.argv[1]}') deve ser um número.")
        sys.exit(1)
        
    role_number_str = sys.argv[2]
    
    if role_number_str not in ROLE_MAP:
        print(f"Erro: Número da permissão ('{role_number_str}') inválido. Use um número de 1 a 4.")
        sys.exit(1)

    target_role = ROLE_MAP[role_number_str]
    target_empresa_id = 1 # ID fixo da empresa IPNET

    db = SessionLocal()
    try:
        print(f"Iniciando processo para o usuário ID {user_id_to_change}...")
        set_user_role_and_associate_empresa(db, user_id=user_id_to_change, new_role=target_role, empresa_id=target_empresa_id)
    finally:
        db.close()