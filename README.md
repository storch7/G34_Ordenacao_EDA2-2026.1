# G34_Ordenacao_EDA2-2026.1

RadixWatch é um projeto acadêmico fullstack focado em análise de logs massivos de servidores (Apache/Nginx) com altíssima performance, utilizando agrupamentos rápidos com algoritmos de baixo nível (Radix Sort e Typed Arrays).

> Link para o vídeo de apresentação: https://youtu.be/xjH9fZNzaOI

## Arquitetura do Monorepo

- `apps/backend`: Motor da API construído com [Bun](https://bun.sh/) e [Elysia](https://elysiajs.com/).
- `apps/frontend`: Aplicação Web desenvolvida com React e [Vite](https://vitejs.dev/).
- `packages/core`: Módulo compartilhado contendo tipos, interfaces genéricas e utilitários de alta performance (como conversão de IP para Uint32).

## Como rodar o projeto

### 1. Instalação de Dependências
Na raiz do projeto (onde está o arquivo `package.json` principal), instale todas as dependências dos workspaces:
\`\`\`bash
bun install
# ou
npm install
\`\`\`

### 2. Rodando o Backend (API)
Abra um terminal, acesse a pasta do backend e inicie o servidor de desenvolvimento:
\`\`\`bash
cd apps/backend
bun run dev
\`\`\`
> O backend estará rodando em `http://localhost:3000`

### 3. Rodando o Frontend (Web App)
Abra um novo terminal (separado do backend), acesse a pasta do frontend e inicie o Vite:
\`\`\`bash
cd apps/frontend
npm run dev
\`\`\`
> O frontend estará rodando em `http://localhost:5173`
