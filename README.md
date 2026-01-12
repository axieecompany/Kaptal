# Nexi - SaaS de Finanças Pessoais

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
# Database (crie o banco 'nexi' no PostgreSQL)
DATABASE_URL="postgresql://user:password@localhost:5432/nexi"

# JWT (use uma chave forte em produção)
JWT_SECRET="sua-chave-secreta-aqui"
JWT_EXPIRES_IN="7d"

# Email (deixe vazio para usar Ethereal em dev)
SMTP_HOST=""
SMTP_PORT=""
SMTP_USER=""
SMTP_PASS=""
EMAIL_FROM="Nexi <noreply@nexi.com>"

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

## 🔐 Fluxo de Autenticação

### Registro
1. Usuário preenche nome, email e senha
2. Sistema envia código de 6 dígitos por email
3. Usuário verifica o código
4. Conta é ativada

### Login
1. Usuário insere email e senha
2. Sistema envia código de 6 dígitos por email
3. Usuário verifica o código
4. JWT é gerado e o usuário é autenticado

## 📧 Email em Desenvolvimento

Se você não configurar as variáveis SMTP, o sistema criará automaticamente uma conta no [Ethereal](https://ethereal.email/). Os emails aparecerão no console com um link para visualização.

## 🔗 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/auth/register` | Registrar novo usuário |
| POST | `/api/auth/verify-email` | Verificar código de email |
| POST | `/api/auth/login` | Iniciar login |
| POST | `/api/auth/verify-login` | Verificar código de login |
| POST | `/api/auth/resend-code` | Reenviar código |
| GET | `/api/auth/me` | Obter usuário autenticado |
| GET | `/api/health` | Health check |

## 📝 Próximas Features

- [ ] Dashboard de finanças
- [ ] CRUD de transações
- [ ] Categorias de gastos
- [ ] Gráficos e visualizações
- [ ] Registro de investimentos
- [ ] Integração com API da B3
- [ ] Ticker de ações em tempo real

## 📄 Licença

MIT
