from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Carrega e valida as variáveis de ambiente da aplicação a partir de um arquivo .env.
    """
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    # Zabbix API Configuration
    ZABBIX_API_URL: str
    ZABBIX_API_USER: str
    ZABBIX_API_PASSWORD: str

    # Gemini API Configuration
    GEMINI_API_KEY: str

# Instância única das configurações para ser usada em toda a aplicação
settings = Settings()
