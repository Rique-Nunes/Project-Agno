# Usa a imagem oficial do Python 3.11, na versão 'slim' que é otimizada em tamanho.
FROM python:3.11-slim

# Define o diretório de trabalho padrão dentro do contêiner.
# Todos os comandos a seguir serão executados a partir deste diretório.
WORKDIR /app

# Define variáveis de ambiente recomendadas para Python em contêineres:
# 1. Impede o Python de gerar arquivos .pyc, economizando espaço.
# 2. Garante que os logs (prints) sejam enviados diretamente para o terminal do contêiner.
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Copia apenas o arquivo de dependências primeiro.
# O Docker funciona em camadas. Se este arquivo não mudar em um próximo build,
# o Docker reutilizará a camada com as dependências já instaladas, tornando o build muito mais rápido.
COPY requirements.txt .

# Instala as dependências listadas no requirements.txt.
# --no-cache-dir desabilita o cache do pip, reduzindo o tamanho da imagem.
RUN pip install --no-cache-dir -r requirements.txt

# Agora, copia todo o código do backend para o diretório de trabalho no contêiner.
COPY . .

# Expõe a porta 8000. O Cloud Run enviará o tráfego para esta porta dentro do contêiner.
EXPOSE 8000

# O comando para iniciar a aplicação quando o contêiner for executado.
# Usamos uvicorn para rodar a aplicação FastAPI.
# --host 0.0.0.0 é crucial para que a aplicação seja acessível de fora do contêiner.
# --port 8000 corresponde à porta que expusemos.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]