import os
from database.connection import SessionLocal
from models.usuario import Usuario
from schemas.roles import UserRole

    # --- Detalhes do Usuário de Teste ---
    # Você pode alterar esses valores se quiser
TEST_USER_EMAIL = "test.user@example.com"
TEST_USER_GOOGLE_ID = "00112233445566778899"
TEST_USER_NAME = "Usuário de Teste"
TEST_USER_PICTURE = "https://i.pravatar.cc/150?u=testuser"


def create_test_user():
    """
    Cria um usuário de teste no banco de dados se ele não existir.
    """
    db = SessionLocal()
    try:
            # Verifica se o usuário já existe pelo e-mail ou Google ID
        existing_user = db.query(Usuario).filter(
            (Usuario.email == TEST_USER_EMAIL) | (Usuario.google_id == TEST_USER_GOOGLE_ID)
        ).first()

        if existing_user:
            print(f"✅ O usuário de teste '{existing_user.name}' ({existing_user.email}) já existe no banco de dados.")
            return

        # Cria a nova instância do usuário
        print(f"🔧 Criando o usuário de teste '{TEST_USER_NAME}'...")
        new_user = Usuario(
            google_id=TEST_USER_GOOGLE_ID,
            email=TEST_USER_EMAIL,
            name=TEST_USER_NAME,
            picture=TEST_USER_PICTURE,
            role=UserRole.VIEWER  # A permissão padrão
        )
        
        db.add(new_user)
        db.commit()
        
        print(f"✅ Sucesso! O usuário '{TEST_USER_NAME}' foi criado com a permissão 'viewer'.")

    except Exception as e:
        print(f"❌ Erro ao tentar criar o usuário de teste: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
     # Garante que estamos no diretório certo para encontrar o banco de dados
        # Isso torna o script executável de qualquer lugar
    script_dir = os.path.dirname(os.path.realpath(__file__))
    os.chdir(script_dir)
    create_test_user()