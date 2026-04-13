# Viewx Analytics — Dashboard de Reels

## Como Rodar com Docker (Passo a Passo)

Este projeto está totalmente configurado para rodar em containers. Siga estes passos para subir a aplicação rapidamente:

   ```bash
   docker-compose up --build
   ```

   - **Frontend:** [http://localhost:3000](http://localhost:3000)
   - **Backend:** [http://localhost:5000](http://localhost:5000)

---

## Scraper Multi-Camadas
Scraper de busca de perfil do instagram com o uso do id pra burlar o bloqueio do instagram pq após algumas verificação de perfies bugava e não dava pra ver mais (o insta bloqueava achando que era bot).
1. **API JSON Nativa**: Primeiro, tenta pegar os dados direto do Instagram de forma rápida, usando caminhos “internos” do próprio site.
2. **GraphQL Fallback**: Se o primeiro método falhar, usa uma alternativa oficial/estruturada pra buscar as informações.
3. **Puppeteer Stealth**: Se tudo mais falhar, ele abre um navegador real (tipo Chrome) disfarçado de usuário normal para tentar pegar os dados.

---

## Tecnologias

### Frontend
- **React 19** + **Vite** (Core)
- **Tailwind CSS 4** (Estilização Moderna)
- **Lucide React** (Ícones)
- **TanStack Query v5** (Gerenciamento de Estado e Cache)
- **Axios** (Comunicação com API)

### Backend
- **Node.js** + **Express**
- **Puppeteer Extra** + **Stealth Plugin** (Scraper)
- **Dotenv** (Configurações de Ambiente)

---

## 📦 Como Rodar o Projeto

### Pré-requisitos
- Node.js lts instalados.
- Docker e Docker Compose (opcional para rodar via container).

### Rodando Localmente

1. **Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
2. **Frontend:**
   ```bash
   cd desafio-viewx
   npm install
   npm run dev
   ```

### Rodando via Docker
```bash
docker compose up --build
```

---

## Estrutura do Projeto
- `backend/src/services/scraper.js`: É onde acontece toda a lógica pesada pra buscar os dados.
- `backend/src/controllers/reelsController.js`: É quem organiza as respostas e cuida dos erros (tipo quando algo dá errado, ele decide o que mostrar).
- `desafio-viewx/src/pages/Home.jsx`: É a tela principal onde o usuário digita o nome e vê os resultados.

---

## Limitações
- O scraping depende da estrutura do DOM do Instagram/TikTok. Se as redes mudarem, o scraper pode quebrar e precisar de ajustes.