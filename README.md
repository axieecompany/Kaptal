# Kaptal - SaaS de Finanças Pessoais

Sistema de finanças pessoais com controle de gastos, investimentos e integração com a bolsa de valores.

## 🚀 Stack

| Camada | Tecnologia |
|--------|------------|
| **Backend** | Node.js + Express + TypeScript |
| **Frontend** | Next.js 15 + TypeScript |
| **Banco de Dados** | PostgreSQL |
| **ORM** | Prisma |
| **Autenticação** | JWT + Bcrypt + 2FA por Email |
| **Email** | Nodemailer |
| **Estilização** | Tailwind CSS |

## 📁 Estrutura do Projeto

```
nexi/
├── backend/           # API Node.js + Express
│   ├── src/
│   │   ├── config/    # Configurações
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── utils/
│   └── prisma/        # Schema do banco
└── frontend/          # Next.js App
    └── src/
        ├── app/       # Pages (App Router)
        ├── components/
        ├── lib/
        └── types/
```

## 🛠️ Configuração

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Backend

1. Entre na pasta do backend:
```bash
cd backend
```

2. Copie o arquivo de exemplo e configure:
```bash
cp .env.example .env
```

3. Edite o `.env` com suas configurações:
```env
# Database (crie o banco 'kaptal' no PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/kaptal"

# JWT (use uma chave forte em produção)
JWT_SECRET="sua-chave-secreta-aqui"
JWT_EXPIRES_IN="7d"

# Email (deixe vazio para usar Ethereal em dev)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="kaptal <noreply@kaptal.com>"

# Server
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

4. Instale as dependências e configure o banco:
```bash
npm install
npx prisma db push
```

5. Inicie o servidor:
```bash
npm run dev
```

### Frontend

1. Entre na pasta do frontend:
```bash
cd frontend
```

2. Copie o arquivo de exemplo:
```bash
cp .env.local.example .env.local
```

3. Instale as dependências:
```bash
npm install
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```
## 📄 Licença

MIT
