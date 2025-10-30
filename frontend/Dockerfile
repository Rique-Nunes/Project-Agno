# --- Estágio 1: "Build" ---
# Usamos a imagem Node.js v18 completa, que contém todas as ferramentas
# necessárias para compilar o projeto. A nomeamos como 'build'.
FROM node:18 AS build

# Define o diretório de trabalho.
WORKDIR /app

# Copia os arquivos de definição de dependências.
COPY package.json package-lock.json ./

# Usa 'npm ci' que é mais rápido e seguro para builds de produção.
# Ele instala as versões exatas do package-lock.json.
RUN npm ci

# Copia todo o código-fonte do projeto.
COPY . .

# Executa o script 'build' do package.json.
# Isso cria uma versão otimizada de produção do seu site na pasta .next.
RUN npm run build

# --- Estágio 2: "Produção" ---
# Começamos de novo com uma imagem base super leve, otimizada para rodar Node.js.
FROM node:18-slim

# Define o diretório de trabalho.
WORKDIR /app

# Define a variável de ambiente para que o Next.js e outras bibliotecas
# saibam que estão rodando em modo de produção.
ENV NODE_ENV production

# Copia os arquivos de dependência novamente.
COPY package.json package-lock.json ./

# Instala SOMENTE as dependências de produção.
# O '--production' ignora todas as 'devDependencies',
# resultando em uma pasta node_modules muito menor.
RUN npm install --production

# Copia os arquivos da build do estágio anterior ('build').
# Copiamos apenas o que é estritamente necessário para rodar o app.
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

# Expõe a porta 3000, que o Next.js usa por padrão em produção.
EXPOSE 3000

# O comando para iniciar o servidor de produção do Next.js.
CMD ["npm", "start"]