from enum import Enum

class UserRole(str, Enum):
    # CORREÇÃO: Os valores do Enum devem ser strings em minúsculas
    # para corresponder ao que o banco de dados armazena.
    VIEWER = "viewer"
    OPERATOR = "operator"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"

# Define a hierarquia dos papéis. Um número maior significa mais privilégios.
ROLE_HIERARCHY = {
    UserRole.VIEWER: 1,
    UserRole.OPERATOR: 2,
    UserRole.ADMIN: 3,
    UserRole.SUPER_ADMIN: 4,
}