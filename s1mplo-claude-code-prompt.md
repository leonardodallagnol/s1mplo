# S1MPLO — Prompt de Arquitetura Completa para Claude Code

## CONTEXTO DO PROJETO

S1mplo é um SaaS brasileiro de copiloto de performance com IA para gestores de tráfego e agências que gerenciam e-commerce. NÃO é um gerador de relatórios — é uma ferramenta de DECISÃO.

O produto conecta 6 plataformas — Meta Ads, Google Ads, TikTok Ads, Google Analytics 4, Nuvemshop e Mercado Livre — em um único painel inteligente por cliente. A IA cruza TODOS os dados entre si para responder a pergunta: "onde devo colocar o próximo real de investimento?"

Diferencial competitivo: nenhum concorrente global (Triple Whale, Polar Analytics, Northbeam) integra com o ecossistema brasileiro (Nuvemshop, Mercado Livre). Nenhum concorrente brasileiro (Reportei, DashGoo/mLabs Analytics) cruza dados de ads com pedidos reais de e-commerce de forma inteligente com IA.

### Público-alvo
- Gestores de tráfego que atendem e-commerces no Brasil
- Agências de performance com 5-20 clientes de e-commerce
- Mercado LATAM como expansão futura

### Governança — Conta → Subcontas → Conexões

A estrutura é hierárquica:

```
Gestor de Tráfego (CONTA principal)
│
├── Cliente A (SUBCONTA / Workspace)
│   ├── Meta Ads (conta de anúncios X)
│   ├── Google Ads (conta Y)
│   ├── Google Analytics 4 (propriedade Z)
│   ├── TikTok Ads (advertiser W)
│   ├── Nuvemshop (loja K)
│   └── Mercado Livre (seller J)
│
├── Cliente B (SUBCONTA / Workspace)
│   ├── Meta Ads (outra conta)
│   ├── Nuvemshop (outra loja)
│   └── Mercado Livre (outro seller)
│
├── Cliente C (SUBCONTA / Workspace)
│   ├── Google Ads
│   ├── TikTok Ads
│   └── Nuvemshop
│
└── ... (quantas subcontas o plano permitir)
```

Regras:
- Uma CONTA = um usuário gestor/agência
- Cada SUBCONTA (workspace) = um cliente do gestor
- Cada subconta pode ter de 0 a 6 conexões (uma por plataforma)
- Subcontas são 100% independentes entre si (dados não se misturam)
- O gestor só conecta as plataformas que o cliente usa
- Limite de subcontas é controlado pelo plano (Starter=3, Pro=10, Agency=ilimitado)

### Cruzamento de Dados — O CORE do produto

Dentro de cada subconta, a IA cruza TODOS os dados automaticamente:

1. **Ads × Pedidos (ROAS Real):**
   Meta Ads reporta R$50k em vendas → mas Nuvemshop confirmou apenas R$38k pagos
   → IA calcula ROAS real e explica a diferença (cancelamentos, fraude, frete)

2. **Ads × Analytics (Validação de Conversão):**
   Google Ads diz 200 conversões → GA4 registrou só 140 sessões com transação
   → IA identifica o gap e possíveis causas (atribuição, tracking, duplicatas)

3. **Canal × Canal (Onde investir mais):**
   Meta Ads ROAS 3.2x vs TikTok Ads ROAS 4.8x vs Mercado Livre orgânico 6.1x
   → IA recomenda redistribuição de budget com projeção de impacto

4. **Funil Completo Cross-Platform:**
   Impressão (Ads) → Clique (Ads) → Sessão (GA4) → Add to Cart (GA4/Nuvemshop) → Checkout → Pedido Pago (Nuvemshop/ML)
   → IA identifica onde está o gargalo exato e o que fazer

5. **Atribuição UTM:**
   Pedido na Nuvemshop com utm_source=facebook, utm_campaign=remarketing_30d
   → IA vincula ao gasto específico da campanha no Meta Ads
   → Calcula ROAS real por campanha, não só por plataforma

6. **Anomalias Cross-Platform:**
   CPA subiu 40% no Meta Ads, mas GA4 mostra que o tráfego orgânico compensou
   → IA contextualiza o alerta com dados de todas as fontes

### Visão do produto
- **Não é dashboard estático.** É copiloto que diz o que fazer.
- **Não é relatório bonito.** É motor de decisão baseado em dados cruzados.
- **A IA é o core**, não uma feature secundária.
- **Cruzamento de dados é o diferencial.** Nenhum dado existe isolado — tudo é analisado em relação a tudo.

Exemplo de output da IA:
"Seu ROAS no Meta Ads foi 4.2x, mas seu ROAS efetivo considerando os pedidos reais da Nuvemshop foi 3.1x. A diferença de 26% é causada por 18% de cancelamentos e frete grátis absorvido. Enquanto isso, seu TikTok Ads gerou ROAS efetivo de 5.1x com apenas 15% do budget total. Seu Mercado Livre teve ROAS efetivo de 5.8x com investimento mínimo em Mercado Livre Ads. O GA4 confirma que 23% das sessões com transação vieram de tráfego orgânico do ML. Recomendação: realocar 20% do budget do Meta para TikTok Ads e testar aumento de 30% no Mercado Livre Ads essa semana."

---

## STACK TÉCNICA

- **Backend:** NestJS (TypeScript) com Prisma ORM
- **Frontend:** React + Vite + Tailwind CSS
- **Banco de Dados:** PostgreSQL
- **Deploy:** Easypanel (Docker containers)
- **Auth:** JWT (access + refresh tokens)
- **Filas/Jobs:** BullMQ + Redis (para sync periódico de dados e jobs de IA)
- **Monorepo:** Turborepo com `apps/api` e `apps/web`
- **IA:** Anthropic Claude API (claude-sonnet-4-20250514) para análises e recomendações
- **Billing:** Asaas (Brasil: Pix, boleto, cartão) + Stripe (LATAM: cartão internacional)

---

## IDENTIDADE VISUAL — Design System S1mplo

A identidade visual do S1mplo vem da marca da agência S1mplo (anti-agency, brutalist-tech). O SaaS herda essa identidade.

### Cores
```css
:root {
  /* Primárias */
  --acid-green: #CCFF00;          /* Cor principal — CTAs, destaques, hover states */
  --void-black: #0A0A0A;          /* Background principal */
  --off-black: #111111;           /* Cards, painéis, sidebar */
  --dark-gray: #1A1A1A;           /* Borders, separadores */
  
  /* Secundárias */
  --white: #FAFAFA;               /* Texto principal sobre fundo escuro */
  --gray-400: #9CA3AF;            /* Texto secundário, labels */
  --gray-600: #4B5563;            /* Texto terciário, placeholders */
  
  /* Semânticas */
  --success: #22C55E;             /* Positivo, ROAS bom, growth */
  --warning: #F59E0B;             /* Atenção, alertas médios */
  --danger: #EF4444;              /* Crítico, ROAS caiu, erro */
  --info: #3B82F6;                /* Informativo, links */
  --opportunity: #A855F7;         /* Oportunidade (insights da IA) */
}
```

### Tipografia
```css
/* Font principal: Space Grotesk (Google Fonts) */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

/* Font monospace para dados/números: JetBrains Mono */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');

body {
  font-family: 'Space Grotesk', sans-serif;
}

/* Números, métricas, KPIs, código */
.metric, .kpi-value, .mono {
  font-family: 'JetBrains Mono', monospace;
}
```

### Hierarquia tipográfica
```
H1: 48px / 700 weight (landing page hero)
H2: 36px / 600 weight (seções)
H3: 24px / 600 weight (cards, títulos de painel)
H4: 18px / 500 weight (subtítulos)
Body: 16px / 400 weight
Small: 14px / 400 weight
Caption: 12px / 400 weight (labels, timestamps)

KPI grande: 48px / 700 weight / JetBrains Mono (ex: "R$ 127.430")
KPI médio: 32px / 600 weight / JetBrains Mono (ex: "ROAS 4.2x")
KPI pequeno: 20px / 500 weight / JetBrains Mono
```

### Componentes visuais
```
Cards:
  background: var(--off-black)
  border: 1px solid var(--dark-gray)
  border-radius: 8px (NÃO arredondamento excessivo — estilo brutalist)
  padding: 24px

Botões primários:
  background: var(--acid-green)
  color: var(--void-black)
  font-weight: 600
  border-radius: 4px (quase quadrado — brutalist)
  text-transform: uppercase
  letter-spacing: 0.05em

Botões secundários:
  background: transparent
  border: 1px solid var(--acid-green)
  color: var(--acid-green)

Sidebar:
  background: var(--void-black)
  width: 240px
  border-right: 1px solid var(--dark-gray)

Gráficos:
  Usar cores: acid-green para métrica principal, 
  #3B82F6 (azul) para secundária,
  #A855F7 (roxo) para terciária,
  #F59E0B (amarelo) para quaternária
  Background do gráfico: transparente sobre card dark
  Grid lines: var(--dark-gray) com 0.3 opacity

Tabelas:
  Header: var(--dark-gray) background
  Rows: alternating var(--off-black) / var(--void-black)
  Hover: border-left 2px solid var(--acid-green)

Badges de insight IA:
  🔴 CRITICAL: background #EF4444/10, border #EF4444, text #EF4444
  🟡 WARNING: background #F59E0B/10, border #F59E0B, text #F59E0B
  🟢 OPPORTUNITY: background #A855F7/10, border #A855F7, text #A855F7
  ℹ️ INFO: background #3B82F6/10, border #3B82F6, text #3B82F6

Copilot Panel (sidebar direita):
  background: var(--off-black)
  border-left: 1px solid var(--acid-green) com 0.3 opacity
  Header com ícone de IA + "S1mplo Copilot" em acid-green
  Input "Pergunte ao copiloto": dark input com border acid-green no focus
```

### Estilo geral
- **Dark mode only.** Não existe light mode. O produto é para gestores que passam horas olhando dados — dark é obrigatório.
- **Brutalist-tech.** Cantos quase retos (4-8px radius max). Sem sombras suaves. Sem gradientes pastel. Linhas retas, contraste alto.
- **Acid Green como destaque.** Nunca como background de área grande. Sempre como accent: botões, borders em hover, ícones ativos, KPIs positivos.
- **Dados em monospace.** Todo número, métrica, valor financeiro usa JetBrains Mono. Isso dá sensação de "terminal de controle", reforça a identidade tech.
- **Espaçamento generoso.** Padding 24px nos cards, gap 16-24px entre elementos. Dados precisam respirar.

### Landing Page — Estrutura
```
1. HERO
   - H1: "Pare de adivinhar. Saiba onde investir." (ou similar)
   - Sub: "O copiloto de performance com IA que cruza seus dados de ads + e-commerce e diz exatamente onde colocar o próximo real."
   - CTA: "COMEÇAR GRÁTIS — 14 DIAS" (acid-green button)
   - Badge: "Meta Ads · Google Ads · TikTok Ads · GA4 · Nuvemshop · Mercado Livre"
   - Screenshot/mockup do dashboard (dark, acid-green accents)

2. PROBLEMA
   - "Você gasta horas no Excel cruzando dados de 6 plataformas diferentes."
   - "O ROAS que o Meta reporta não é o ROAS real."
   - "Você não sabe se deve colocar mais dinheiro no Meta, TikTok ou Mercado Livre."

3. SOLUÇÃO (3 colunas com ícones)
   - Conecte: "6 plataformas em 2 minutos"
   - Cruze: "Dados de ads × pedidos reais × analytics — automaticamente"
   - Decida: "IA analisa tudo e diz o que fazer"

4. FEATURES (com screenshots/mockups)
   - ROAS Real vs Reportado
   - Funil Cross-Platform
   - Copiloto IA com recomendações
   - Alertas automáticos
   - Multi-cliente (subcontas)

5. PRICING (3 cards)
   - Starter R$197 / Pro R$397 / Agency R$697
   - Trial 14 dias grátis em destaque

6. FAQ
   - "Preciso dar acesso às contas dos meus clientes?" → Não, o cliente autoriza via OAuth
   - "Funciona com Mercado Livre?" → Sim, cruzamos dados de ads + vendas do ML
   - "A IA é confiável?" → Ela analisa dados reais, não inventa. Mostra as fontes.

7. FOOTER
   - Logo S1mplo
   - Links: Entrar, Criar conta, Termos, Privacidade
   - "Feito no Brasil 🇧🇷 para gestores que levam dados a sério."
```

---

```
s1mplo/
├── turbo.json
├── package.json
├── docker-compose.yml
├── .env.example
├── packages/
│   └── shared/                    # Tipos e utilidades compartilhadas
│       ├── src/
│       │   ├── types/
│       │   │   ├── unified-order.ts       # Modelo unificado de pedido
│       │   │   ├── unified-ad-metrics.ts  # Modelo unificado de métricas de ads
│       │   │   ├── ai-insight.ts          # Modelo de insight gerado pela IA
│       │   │   └── index.ts
│       │   └── utils/
│       │       └── date-helpers.ts
│       ├── package.json
│       └── tsconfig.json
├── apps/
│   ├── api/                       # NestJS Backend
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── common/
│   │   │   │   ├── guards/
│   │   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   │   └── workspace-access.guard.ts
│   │   │   │   ├── decorators/
│   │   │   │   │   ├── current-user.decorator.ts
│   │   │   │   │   └── current-workspace.decorator.ts
│   │   │   │   ├── interceptors/
│   │   │   │   │   └── transform.interceptor.ts
│   │   │   │   └── filters/
│   │   │   │       └── http-exception.filter.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.module.ts
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── strategies/
│   │   │   │   │   │   └── jwt.strategy.ts
│   │   │   │   │   └── dto/
│   │   │   │   │       ├── register.dto.ts
│   │   │   │   │       └── login.dto.ts
│   │   │   │   ├── users/
│   │   │   │   │   ├── users.module.ts
│   │   │   │   │   ├── users.controller.ts
│   │   │   │   │   └── users.service.ts
│   │   │   │   ├── workspaces/
│   │   │   │   │   ├── workspaces.module.ts
│   │   │   │   │   ├── workspaces.controller.ts
│   │   │   │   │   └── workspaces.service.ts
│   │   │   │   ├── connections/
│   │   │   │   │   ├── connections.module.ts
│   │   │   │   │   ├── connections.controller.ts
│   │   │   │   │   ├── connections.service.ts
│   │   │   │   │   └── dto/
│   │   │   │   │       └── create-connection.dto.ts
│   │   │   │   ├── oauth/
│   │   │   │   │   ├── oauth.module.ts
│   │   │   │   │   ├── oauth.controller.ts
│   │   │   │   │   ├── oauth.service.ts
│   │   │   │   │   └── providers/
│   │   │   │   │       ├── meta-ads.provider.ts
│   │   │   │   │       ├── google-ads.provider.ts
│   │   │   │   │       ├── google-analytics.provider.ts  # Mesmo OAuth flow do Google Ads
│   │   │   │   │       ├── tiktok-ads.provider.ts
│   │   │   │   │       ├── nuvemshop.provider.ts
│   │   │   │   │       └── mercadolivre.provider.ts
│   │   │   │   ├── sync/
│   │   │   │   │   ├── sync.module.ts
│   │   │   │   │   ├── sync.service.ts
│   │   │   │   │   ├── sync.processor.ts       # BullMQ processor
│   │   │   │   │   └── adapters/
│   │   │   │   │       ├── base.adapter.ts
│   │   │   │   │       ├── meta-ads.adapter.ts
│   │   │   │   │       ├── google-ads.adapter.ts
│   │   │   │   │       ├── google-analytics.adapter.ts
│   │   │   │   │       ├── tiktok-ads.adapter.ts
│   │   │   │   │       ├── nuvemshop.adapter.ts
│   │   │   │   │       └── mercadolivre.adapter.ts
│   │   │   │   ├── ai/
│   │   │   │   │   ├── ai.module.ts
│   │   │   │   │   ├── ai.service.ts           # Claude API integration
│   │   │   │   │   ├── ai.controller.ts
│   │   │   │   │   ├── ai.processor.ts         # BullMQ job para análises agendadas
│   │   │   │   │   ├── prompts/
│   │   │   │   │   │   ├── performance-analysis.prompt.ts
│   │   │   │   │   │   ├── budget-reallocation.prompt.ts
│   │   │   │   │   │   ├── funnel-diagnosis.prompt.ts
│   │   │   │   │   │   └── alert-detection.prompt.ts
│   │   │   │   │   └── dto/
│   │   │   │   │       ├── request-insight.dto.ts
│   │   │   │   │       └── insight-response.dto.ts
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── dashboard.module.ts
│   │   │   │   │   ├── dashboard.controller.ts
│   │   │   │   │   └── dashboard.service.ts
│   │   │   │   ├── reports/
│   │   │   │   │   ├── reports.module.ts
│   │   │   │   │   ├── reports.controller.ts
│   │   │   │   │   └── reports.service.ts
│   │   │   │   ├── alerts/
│   │   │   │   │   ├── alerts.module.ts
│   │   │   │   │   ├── alerts.service.ts
│   │   │   │   │   └── alerts.processor.ts     # Detecta anomalias e envia alertas
│   │   │   │   └── billing/
│   │   │   │       ├── billing.module.ts
│   │   │   │       ├── billing.controller.ts
│   │   │   │       ├── billing.service.ts
│   │   │   │       └── providers/
│   │   │   │           ├── asaas.provider.ts    # Brasil: Pix, boleto, cartão
│   │   │   │           └── stripe.provider.ts   # LATAM: cartão internacional
│   │   │   └── prisma/
│   │   │       ├── prisma.module.ts
│   │   │       └── prisma.service.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                       # React + Vite Frontend
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── router.tsx
│       │   ├── lib/
│       │   │   ├── api.ts                  # Axios instance com interceptors
│       │   │   └── auth.ts                 # Token management
│       │   ├── hooks/
│       │   │   ├── useAuth.ts
│       │   │   ├── useWorkspaces.ts
│       │   │   ├── useConnections.ts
│       │   │   └── useAIInsights.ts
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   │   ├── Sidebar.tsx
│       │   │   │   ├── Header.tsx
│       │   │   │   └── DashboardLayout.tsx
│       │   │   ├── connections/
│       │   │   │   ├── ConnectionCard.tsx
│       │   │   │   ├── ConnectButton.tsx
│       │   │   │   └── ConnectionStatus.tsx
│       │   │   ├── dashboard/
│       │   │   │   ├── KPICard.tsx
│       │   │   │   ├── RevenueChart.tsx
│       │   │   │   ├── ROASByChannel.tsx
│       │   │   │   ├── FunnelChart.tsx
│       │   │   │   └── ChannelComparison.tsx
│       │   │   ├── ai/
│       │   │   │   ├── InsightCard.tsx          # Card de insight da IA
│       │   │   │   ├── CopilotPanel.tsx         # Painel lateral do copiloto
│       │   │   │   ├── RecommendationBadge.tsx
│       │   │   │   └── AskCopilot.tsx           # Input para perguntar à IA
│       │   │   ├── alerts/
│       │   │   │   ├── AlertBanner.tsx
│       │   │   │   └── AlertList.tsx
│       │   │   └── ui/
│       │   │       ├── Button.tsx
│       │   │       ├── Card.tsx
│       │   │       ├── Input.tsx
│       │   │       ├── Modal.tsx
│       │   │       └── Spinner.tsx
│       │   ├── pages/
│       │   │   ├── Login.tsx
│       │   │   ├── Register.tsx
│       │   │   ├── Workspaces.tsx
│       │   │   ├── WorkspaceSetup.tsx
│       │   │   ├── Dashboard.tsx
│       │   │   ├── Copilot.tsx              # Página principal do copiloto IA
│       │   │   ├── Connections.tsx
│       │   │   ├── Reports.tsx
│       │   │   ├── Alerts.tsx
│       │   │   ├── Settings.tsx
│       │   │   └── Billing.tsx
│       │   └── styles/
│       │       └── globals.css
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
```

---

## SCHEMA DO BANCO DE DADOS (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== AUTH & USERS ====================

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  name          String
  country       String   @default("BR")    // Para determinar gateway de billing
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  workspaces    WorkspaceMember[]
  subscription  Subscription?
}

model Subscription {
  id            String   @id @default(cuid())
  userId        String   @unique
  user          User     @relation(fields: [userId], references: [id])
  plan          Plan     @default(TRIAL)
  status        SubscriptionStatus @default(TRIAL)
  maxWorkspaces Int      @default(10)      // Trial = Pro completo
  aiCredits     Int      @default(-1)      // -1 = ilimitado (trial), 10 = Starter, -1 = Pro/Agency
  gateway       BillingGateway @default(ASAAS)
  gatewayCustomerId   String?              // ID do cliente no Asaas ou Stripe
  gatewaySubscriptionId String?            // ID da assinatura no gateway
  trialEndsAt   DateTime?
  currentPeriodStart DateTime @default(now())
  currentPeriodEnd   DateTime
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

enum Plan {
  TRIAL       // 14 dias grátis, acesso Pro completo
  STARTER     // R$197/mês - até 3 clientes, 10 análises IA/mês
  PRO         // R$397/mês - até 10 clientes, IA ilimitada, ML+Shopee
  AGENCY      // R$697/mês - ilimitado, client portal, multi-usuário
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  CANCELED
  SUSPENDED
}

enum BillingGateway {
  ASAAS       // Brasil: Pix, boleto, cartão
  STRIPE      // LATAM/Internacional: cartão
}

// ==================== WORKSPACES (MULTI-TENANT) ====================

model Workspace {
  id            String   @id @default(cuid())
  name          String
  slug          String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  members       WorkspaceMember[]
  connections   Connection[]
  adMetrics     AdMetric[]
  analyticsMetrics AnalyticsMetric[]
  orders        Order[]
  syncLogs      SyncLog[]
  aiInsights    AIInsight[]
  alerts        Alert[]
}

model WorkspaceMember {
  id          String   @id @default(cuid())
  userId      String
  workspaceId String
  role        WorkspaceRole @default(OWNER)
  createdAt   DateTime @default(now())

  user        User      @relation(fields: [userId], references: [id])
  workspace   Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  @@unique([userId, workspaceId])
}

enum WorkspaceRole {
  OWNER
  MANAGER     // Pode editar, não pode deletar workspace
  VIEWER      // Só visualiza (para client portal futuro)
}

// ==================== CONNECTIONS (OAuth) ====================

model Connection {
  id            String   @id @default(cuid())
  workspaceId   String
  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  platform      Platform
  platformAccountId   String       // ID da conta na plataforma
  platformAccountName String?      // Nome legível (ex: "Corel Resinas - Meta Ads")

  accessToken   String             // Encriptado em produção
  refreshToken  String?            // Encriptado em produção
  tokenExpiresAt DateTime?
  scopes        String?

  status        ConnectionStatus @default(ACTIVE)
  lastSyncAt    DateTime?
  lastSyncError String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  adMetrics     AdMetric[]
  analyticsMetrics AnalyticsMetric[]
  orders        Order[]
  syncLogs      SyncLog[]

  @@unique([workspaceId, platform, platformAccountId])
}

enum Platform {
  META_ADS
  GOOGLE_ADS
  GOOGLE_ANALYTICS
  TIKTOK_ADS
  NUVEMSHOP
  MERCADO_LIVRE
  // Futuro (mês 2-3):
  // SHOPIFY
  // AMAZON
  // SHOPEE
  // LOJA_INTEGRADA
}

enum ConnectionStatus {
  ACTIVE
  ERROR
  EXPIRED
  DISCONNECTED
}

// ==================== DADOS UNIFICADOS ====================

// Métricas de Ads (Meta Ads, Google Ads)
model AdMetric {
  id            String   @id @default(cuid())
  workspaceId   String
  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  connectionId  String
  connection    Connection @relation(fields: [connectionId], references: [id], onDelete: Cascade)

  date          DateTime @db.Date
  platform      Platform

  // Métricas unificadas
  impressions   Int      @default(0)
  clicks        Int      @default(0)
  spend         Decimal  @db.Decimal(12, 2) @default(0)
  conversions   Int      @default(0)
  revenue       Decimal  @db.Decimal(12, 2) @default(0)

  // Métricas de funil
  addToCart     Int      @default(0)
  initiateCheckout Int   @default(0)
  purchases     Int      @default(0)

  // Detalhes
  campaignId    String?
  campaignName  String?
  adSetId       String?
  adSetName     String?

  // Métricas calculadas (preenchidas pelo sync)
  cpc           Decimal? @db.Decimal(10, 2)
  ctr           Decimal? @db.Decimal(8, 4)
  cpa           Decimal? @db.Decimal(10, 2)
  roas          Decimal? @db.Decimal(8, 2)

  createdAt     DateTime @default(now())

  @@unique([connectionId, date, campaignId])
  @@index([workspaceId, date])
  @@index([workspaceId, platform, date])
}

// Pedidos do E-commerce (Nuvemshop, Mercado Livre, futuro: Shopify, Amazon, Shopee)
model Order {
  id                String   @id @default(cuid())
  workspaceId       String
  workspace         Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  connectionId      String
  connection        Connection @relation(fields: [connectionId], references: [id], onDelete: Cascade)

  platform          Platform
  platformOrderId   String
  orderDate         DateTime
  status            OrderStatus

  // Valores unificados
  subtotal          Decimal  @db.Decimal(12, 2)
  shipping          Decimal  @db.Decimal(12, 2) @default(0)
  discount          Decimal  @db.Decimal(12, 2) @default(0)
  total             Decimal  @db.Decimal(12, 2)

  // Atribuição (UTM) — crucial para cruzar ads com vendas
  utmSource         String?
  utmMedium         String?
  utmCampaign       String?
  utmContent        String?

  // Cliente
  customerEmail     String?
  customerCity      String?
  customerState     String?

  itemCount         Int      @default(1)

  createdAt         DateTime @default(now())

  @@unique([connectionId, platformOrderId])
  @@index([workspaceId, orderDate])
  @@index([workspaceId, platform, orderDate])
  @@index([workspaceId, utmSource, utmMedium])
}

enum OrderStatus {
  PENDING
  PAID
  SHIPPED
  DELIVERED
  CANCELED
  REFUNDED
}

// Métricas do Google Analytics 4 (sessões, tráfego, comportamento)
model AnalyticsMetric {
  id            String   @id @default(cuid())
  workspaceId   String
  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  connectionId  String
  connection    Connection @relation(fields: [connectionId], references: [id], onDelete: Cascade)

  date          DateTime @db.Date

  // Tráfego
  sessions      Int      @default(0)
  users         Int      @default(0)
  newUsers      Int      @default(0)
  pageviews     Int      @default(0)
  bounceRate    Decimal? @db.Decimal(6, 4)
  avgSessionDuration Decimal? @db.Decimal(10, 2)  // em segundos

  // Fonte de tráfego (para cruzamento com ads)
  source        String?     // google, facebook, tiktok, mercadolivre, direct, organic
  medium        String?     // cpc, cpm, organic, referral, none
  campaign      String?     // nome da campanha UTM

  // E-commerce (GA4 e-commerce events)
  transactions  Int      @default(0)
  ecommerceRevenue Decimal? @db.Decimal(12, 2)
  addToCarts    Int      @default(0)
  checkouts     Int      @default(0)

  createdAt     DateTime @default(now())

  @@unique([connectionId, date, source, medium, campaign])
  @@index([workspaceId, date])
  @@index([workspaceId, source, medium, date])
}

// ==================== IA — INSIGHTS E RECOMENDAÇÕES ====================

model AIInsight {
  id            String   @id @default(cuid())
  workspaceId   String
  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  type          InsightType
  severity      InsightSeverity
  title         String              // Ex: "ROAS efetivo 26% menor que reportado"
  summary       String              // Resumo curto
  detail        String   @db.Text   // Análise completa da IA
  recommendation String  @db.Text   // Ação recomendada
  dataSnapshot  Json?               // Dados usados para gerar o insight (para auditoria)

  isRead        Boolean  @default(false)
  isDismissed   Boolean  @default(false)

  periodStart   DateTime
  periodEnd     DateTime
  createdAt     DateTime @default(now())

  @@index([workspaceId, createdAt])
  @@index([workspaceId, type, isRead])
}

enum InsightType {
  PERFORMANCE_ANALYSIS    // Análise geral de performance
  BUDGET_REALLOCATION     // Sugestão de redistribuição de budget
  FUNNEL_DIAGNOSIS        // Diagnóstico de gargalo no funil
  ANOMALY_DETECTION       // Algo mudou significativamente
  CHANNEL_COMPARISON      // Comparativo entre canais/plataformas
  ROAS_DISCREPANCY        // Diferença entre ROAS reportado e real
}

enum InsightSeverity {
  INFO          // Informativo
  WARNING       // Atenção necessária
  CRITICAL      // Ação imediata recomendada
  OPPORTUNITY   // Oportunidade de ganho
}

// ==================== ALERTAS ====================

model Alert {
  id            String   @id @default(cuid())
  workspaceId   String
  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)

  type          AlertType
  message       String
  metadata      Json?               // Dados adicionais do alerta
  isRead        Boolean  @default(false)
  createdAt     DateTime @default(now())

  @@index([workspaceId, isRead, createdAt])
}

enum AlertType {
  ROAS_DROP             // ROAS caiu abaixo do threshold
  CPA_SPIKE             // CPA subiu acima do threshold
  SPEND_ANOMALY         // Gasto fora do padrão
  CONNECTION_ERROR      // Conexão com plataforma falhou
  SYNC_FAILURE          // Falha na sincronização
  BUDGET_EXHAUSTING     // Budget próximo de esgotar
  CONVERSION_DROP       // Taxa de conversão caiu
}

// ==================== SYNC ====================

model SyncLog {
  id            String   @id @default(cuid())
  workspaceId   String
  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  connectionId  String
  connection    Connection @relation(fields: [connectionId], references: [id], onDelete: Cascade)

  status        SyncStatus
  recordsProcessed Int    @default(0)
  errorMessage  String?
  startedAt     DateTime @default(now())
  completedAt   DateTime?
}

enum SyncStatus {
  RUNNING
  COMPLETED
  FAILED
}
```

---

## ENDPOINTS DA API

### Auth
```
POST   /auth/register          — Criar conta (detecta país para billing gateway)
POST   /auth/login             — Login (retorna JWT)
POST   /auth/refresh           — Refresh token
GET    /auth/me                — Dados do usuário logado + plano + limites
```

### Workspaces
```
GET    /workspaces             — Listar workspaces do usuário
POST   /workspaces             — Criar workspace (verifica limite do plano)
GET    /workspaces/:id         — Detalhes do workspace
PUT    /workspaces/:id         — Atualizar workspace
DELETE /workspaces/:id         — Deletar workspace
```

### Connections (OAuth)
```
GET    /workspaces/:id/connections                    — Listar conexões do workspace
GET    /oauth/:platform/authorize?workspaceId=xxx     — Iniciar OAuth flow
GET    /oauth/:platform/callback                       — Callback do OAuth
DELETE /workspaces/:id/connections/:connectionId       — Desconectar
POST   /workspaces/:id/connections/:connectionId/sync  — Forçar sync manual
```

### Dashboard
```
GET    /workspaces/:id/dashboard?startDate=&endDate=         — KPIs consolidados
GET    /workspaces/:id/dashboard/ads?startDate=&endDate=     — Métricas de ads por plataforma
GET    /workspaces/:id/dashboard/orders?startDate=&endDate=  — Pedidos por plataforma
GET    /workspaces/:id/dashboard/funnel?startDate=&endDate=  — Funil de conversão
GET    /workspaces/:id/dashboard/channels?startDate=&endDate= — Comparativo entre canais
GET    /workspaces/:id/dashboard/real-roas?startDate=&endDate= — ROAS real (ads cruzado com pedidos)
```

### AI Copilot
```
POST   /workspaces/:id/ai/analyze            — Solicitar análise completa (consome crédito IA)
POST   /workspaces/:id/ai/ask                — Pergunta livre ao copiloto sobre os dados
GET    /workspaces/:id/ai/insights            — Listar insights gerados
GET    /workspaces/:id/ai/insights/:insightId — Detalhe de um insight
PUT    /workspaces/:id/ai/insights/:insightId — Marcar como lido/dismissido
GET    /workspaces/:id/ai/recommendations     — Recomendações ativas de realocação de budget
```

### Alerts
```
GET    /workspaces/:id/alerts                 — Listar alertas
PUT    /workspaces/:id/alerts/:alertId/read   — Marcar como lido
GET    /workspaces/:id/alerts/settings        — Config de thresholds de alerta
PUT    /workspaces/:id/alerts/settings        — Atualizar thresholds
```

### Billing
```
GET    /billing/subscription           — Status da assinatura
POST   /billing/checkout               — Criar sessão de checkout (Asaas ou Stripe, baseado no país)
POST   /billing/webhook/asaas          — Webhook do Asaas
POST   /billing/webhook/stripe         — Webhook do Stripe
PUT    /billing/plan                   — Mudar de plano (upgrade/downgrade)
```

### Reports (futuro, não MVP)
```
GET    /workspaces/:id/reports/export?format=pdf  — Exportar relatório
```

---

## ADAPTER PATTERN (Sync de Dados)

Cada plataforma implementa a interface base:

```typescript
// apps/api/src/modules/sync/adapters/base.adapter.ts

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface UnifiedAdMetric {
  date: Date;
  platform: Platform;
  impressions: number;
  clicks: number;
  spend: number;
  conversions: number;
  revenue: number;
  addToCart: number;
  initiateCheckout: number;
  purchases: number;
  campaignId?: string;
  campaignName?: string;
  adSetId?: string;
  adSetName?: string;
}

export interface UnifiedOrder {
  platformOrderId: string;
  orderDate: Date;
  status: OrderStatus;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  customerEmail?: string;
  customerCity?: string;
  customerState?: string;
  itemCount: number;
}

export interface UnifiedAnalyticsMetric {
  date: Date;
  sessions: number;
  users: number;
  newUsers: number;
  pageviews: number;
  bounceRate?: number;
  avgSessionDuration?: number;
  source?: string;          // google, facebook, tiktok, direct, etc
  medium?: string;          // cpc, organic, referral, none
  campaign?: string;        // UTM campaign name
  transactions: number;
  ecommerceRevenue?: number;
  addToCarts: number;
  checkouts: number;
}

export abstract class BasePlatformAdapter {
  abstract platform: Platform;

  // Para plataformas de ads (Meta, Google, TikTok)
  abstract fetchAdMetrics(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<UnifiedAdMetric[]>;

  // Para plataformas de e-commerce (Nuvemshop, ML)
  abstract fetchOrders(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<UnifiedOrder[]>;

  // Para plataformas de analytics (GA4)
  abstract fetchAnalytics(
    connection: Connection,
    dateRange: DateRange,
  ): Promise<UnifiedAnalyticsMetric[]>;

  abstract refreshToken(connection: Connection): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  }>;

  abstract validateConnection(connection: Connection): Promise<boolean>;
}

// NOTA: Cada adapter implementa apenas os métodos relevantes.
// MetaAdsAdapter implementa fetchAdMetrics (os outros retornam [])
// NuvemshopAdapter implementa fetchOrders
// GoogleAnalyticsAdapter implementa fetchAnalytics
// Adapters de ads que não têm orders retornam [] para fetchOrders, etc.
```

---

## AI SERVICE — CORE DO PRODUTO

```typescript
// apps/api/src/modules/ai/ai.service.ts

// O AI Service é o coração do S1mplo.
// Ele recebe dados consolidados do workspace e gera insights acionáveis.

// Fluxo principal:
// 1. Dashboard Service consolida dados de ads + pedidos do período
// 2. AI Service recebe esse snapshot de dados
// 3. Monta um prompt contextualizado com os dados reais
// 4. Envia para Claude API (claude-sonnet-4-20250514)
// 5. Parseia a resposta em insights estruturados
// 6. Salva no banco como AIInsight
// 7. Se detectar algo crítico, cria Alert

// Tipos de análise:
// - PERFORMANCE_ANALYSIS: "Como foi a performance geral no período?"
// - BUDGET_REALLOCATION: "Onde devo colocar mais/menos dinheiro?"
// - FUNNEL_DIAGNOSIS: "Onde tá o gargalo? Impressão→Clique→Carrinho→Checkout→Pedido"
// - ROAS_DISCREPANCY: "ROAS do Meta diz X, mas pedidos reais dizem Y. Por quê?"
// - CHANNEL_COMPARISON: "Meta vs Google vs ML: qual performa melhor e por quê?"

// Prompt base (performance-analysis.prompt.ts):
// Inclui: spend por canal, ROAS por canal, pedidos reais por plataforma,
// taxa de cancelamento, ticket médio, funil de conversão,
// UTM attribution (qual fonte gerou qual pedido),
// comparativo com período anterior

// A IA responde em JSON estruturado:
// {
//   "title": "string",
//   "severity": "INFO|WARNING|CRITICAL|OPPORTUNITY",
//   "summary": "string (2-3 linhas)",
//   "detail": "string (análise completa)",
//   "recommendation": "string (ação concreta)",
//   "metrics": { ... dados de suporte }
// }
```

---

## OAUTH FLOWS

### Meta Ads
```
1. GET /oauth/meta-ads/authorize?workspaceId=xxx
2. Redireciona para Facebook OAuth:
   https://www.facebook.com/v21.0/dialog/oauth?
     client_id={META_APP_ID}&
     redirect_uri={BACKEND_URL}/oauth/meta-ads/callback&
     scope=ads_read,ads_management,read_insights&
     state={workspaceId_encrypted}
3. Callback troca code por access_token
4. Busca ad accounts: GET /v21.0/me/adaccounts
5. Usuário seleciona conta → salva Connection
```

### Google Ads + Google Analytics 4 (OAuth combinado)
```
1. GET /oauth/google/authorize?workspaceId=xxx
2. Redireciona para Google OAuth consent screen com AMBOS os scopes:
   scope: https://www.googleapis.com/auth/adwords
          https://www.googleapis.com/auth/analytics.readonly
3. Callback troca code por access_token + refresh_token
4. Com o mesmo token, busca:
   - Google Ads: customer IDs acessíveis
   - GA4: propriedades acessíveis via Admin API
5. Usuário seleciona qual conta Google Ads E/OU qual propriedade GA4 vincular
6. Cria 1 ou 2 Connections no workspace (uma GOOGLE_ADS, uma GOOGLE_ANALYTICS)
   Ambas compartilham o mesmo refresh_token
NOTA: O usuário autoriza UMA VEZ e conecta os dois serviços.
Se o cliente não usa Google Ads, pode conectar só GA4 e vice-versa.
```

### TikTok Ads
```
1. GET /oauth/tiktok-ads/authorize?workspaceId=xxx
2. Redireciona para TikTok Business OAuth:
   https://business-api.tiktok.com/portal/auth?app_id={TIKTOK_APP_ID}&
     redirect_uri={BACKEND_URL}/oauth/tiktok-ads/callback&
     state={workspaceId_encrypted}
3. Callback recebe auth_code
4. Troca auth_code por access_token via:
   POST https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/
   body: { app_id, secret, auth_code }
5. Resposta inclui access_token + lista de advertiser_ids
6. Usuário seleciona qual advertiser_id vincular
7. Salva Connection
NOTA: Token do TikTok Marketing API é de longa duração (não expira).
```

### Nuvemshop
```
1. GET /oauth/nuvemshop/authorize?workspaceId=xxx
2. Redireciona para:
   https://www.tiendanube.com/apps/{APP_ID}/authorize?
     state={workspaceId_encrypted}
3. Callback troca code por access_token + store_id
4. Salva Connection com store_id como platformAccountId
```

### Mercado Livre
```
1. GET /oauth/mercadolivre/authorize?workspaceId=xxx
2. Redireciona para:
   https://auth.mercadolivre.com.br/authorization?
     response_type=code&
     client_id={ML_APP_ID}&
     redirect_uri={BACKEND_URL}/oauth/mercadolivre/callback&
     state={workspaceId_encrypted}
3. Callback troca code por access_token + refresh_token via:
   POST https://api.mercadolibre.com/oauth/token
4. Access token válido por 6h, refresh token para renovar
5. Busca dados do seller: GET /users/me
6. Salva Connection com user_id como platformAccountId
7. Configura webhook para notificações de orders_v2
```

---

## SYNC ENGINE (BullMQ)

```typescript
// Queues:
// - sync:ad-metrics     — roda a cada 6 horas (Meta Ads, Google Ads, TikTok Ads)
// - sync:analytics       — roda a cada 6 horas (Google Analytics 4)
// - sync:orders         — roda a cada 2 horas (Nuvemshop, Mercado Livre)
// - sync:ml-webhooks    — processa webhooks do Mercado Livre em tempo real
// - ai:scheduled-analysis — roda 1x por dia (manhã) para cada workspace ativo
// - ai:cross-data       — roda após cada sync completo, cruza dados entre plataformas
// - alerts:check        — roda a cada 1 hora, verifica thresholds

// Fluxo sync:
// 1. Cron job dispara jobs para cada Connection ativa
// 2. Processor identifica o adapter correto pela Platform
// 3. Adapter busca dados da API e retorna formato unificado
// 4. Service faz upsert no banco (evita duplicatas)
// 5. Atualiza lastSyncAt na Connection
// 6. Registra SyncLog
// 7. Se sync completou, dispara job de alert:check pro workspace

// Fluxo AI agendada:
// 1. Cron job dispara ai:scheduled-analysis para cada workspace com plano Pro/Agency
// 2. Consolida dados dos últimos 7 dias
// 3. Envia para Claude API
// 4. Salva insights no banco
// 5. Se severity = CRITICAL, cria Alert

// Retry: 3 tentativas com backoff exponencial
// Se falhar 3x, marca Connection como ERROR e cria Alert
```

---

## BILLING — DUAL GATEWAY

```typescript
// Lógica de seleção de gateway:
// 1. Usuário se cadastra
// 2. Detecta país pelo campo 'country' no registro (ou IP como fallback)
// 3. Brasil → Asaas (Pix, boleto, cartão) — gateway = ASAAS
// 4. LATAM/outro → Stripe (cartão) — gateway = STRIPE

// Trial:
// - 14 dias grátis com acesso Pro completo
// - Sem cartão no cadastro
// - Dia 10: email "faltam 4 dias"
// - Dia 13: email "último dia, escolha seu plano"
// - Dia 14: bloqueia acesso, mantém dados 30 dias

// Planos Brasil (Asaas):
// - Starter: R$197/mês (até 3 workspaces, 10 análises IA/mês)
// - Pro: R$397/mês (até 10 workspaces, IA ilimitada, ML+alertas)
// - Agency: R$697/mês (ilimitado, client portal, multi-user)
// - Anual: 2 meses grátis (paga 10, leva 12)

// Planos LATAM (Stripe, USD):
// - Starter: $39/mo
// - Pro: $79/mo
// - Agency: $139/mo

// Inadimplência:
// - Dia 1: retry automático
// - Dia 3: email + banner no app
// - Dia 7: segundo retry
// - Dia 15: acesso read-only
// - Dia 30: suspende conta, mantém dados 60 dias

// Webhook handlers:
// - POST /billing/webhook/asaas → processa eventos Asaas (PAYMENT_CONFIRMED, etc)
// - POST /billing/webhook/stripe → processa eventos Stripe (invoice.paid, etc)
// - Ambos atualizam Subscription.status no banco
```

---

## DOCKER-COMPOSE

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: s1mplo
      POSTGRES_PASSWORD: s1mplo_dev
      POSTGRES_DB: s1mplo
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://s1mplo:s1mplo_dev@postgres:5432/s1mplo
      REDIS_URL: redis://redis:6379
      JWT_SECRET: s1mplo-dev-secret-change-in-prod
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
      META_APP_ID: ${META_APP_ID}
      META_APP_SECRET: ${META_APP_SECRET}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      NUVEMSHOP_APP_ID: ${NUVEMSHOP_APP_ID}
      NUVEMSHOP_APP_SECRET: ${NUVEMSHOP_APP_SECRET}
      ML_APP_ID: ${ML_APP_ID}
      ML_SECRET_KEY: ${ML_SECRET_KEY}
      TIKTOK_APP_ID: ${TIKTOK_APP_ID}
      TIKTOK_APP_SECRET: ${TIKTOK_APP_SECRET}
      ASAAS_API_KEY: ${ASAAS_API_KEY}
      ASAAS_WEBHOOK_TOKEN: ${ASAAS_WEBHOOK_TOKEN}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
      STRIPE_WEBHOOK_SECRET: ${STRIPE_WEBHOOK_SECRET}
      FRONTEND_URL: http://localhost:5173
      BACKEND_URL: http://localhost:3001
    depends_on:
      - postgres
      - redis

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3001

volumes:
  postgres_data:
```

---

## .env.example

```env
# Database
DATABASE_URL=postgresql://s1mplo:s1mplo_dev@localhost:5432/s1mplo

# Redis
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=s1mplo-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Anthropic (IA - CORE)
ANTHROPIC_API_KEY=

# Meta Ads
META_APP_ID=
META_APP_SECRET=

# Google Ads
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_DEVELOPER_TOKEN=

# Nuvemshop
NUVEMSHOP_APP_ID=
NUVEMSHOP_APP_SECRET=

# Mercado Livre
ML_APP_ID=
ML_SECRET_KEY=

# TikTok Ads
TIKTOK_APP_ID=
TIKTOK_APP_SECRET=

# Billing - Asaas (Brasil)
ASAAS_API_KEY=
ASAAS_WEBHOOK_TOKEN=

# Billing - Stripe (LATAM)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# App
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3001
NODE_ENV=development
```

---

## INSTRUÇÕES PARA O CLAUDE CODE

Ao executar este prompt, siga esta ordem de implementação:

### FASE 1 — Fundação (Semana 1)
1. **Inicialize o monorepo** com Turborepo, crie `apps/api` (NestJS) e `apps/web` (React + Vite + Tailwind).
2. **Configure o Prisma** com o schema completo acima (incluindo AnalyticsMetric) e gere a primeira migration.
3. **Implemente o módulo de Auth** completo: register (com campo country), login, JWT access/refresh tokens.
4. **Implemente o módulo de Workspaces** com CRUD completo e guard de acesso (verificar limite do plano = limite de subcontas).
5. **Implemente o módulo de Connections** com a estrutura OAuth e lógica de vincular conexões a workspaces.
6. **Implemente Meta Ads OAuth** completo: authorize → callback → token exchange → listar ad accounts → salvar conexão.

### FASE 2 — Integrações de Dados (Semana 2)
7. **Implemente o adapter base** e o `MetaAdsAdapter` (fetch ad metrics com campaign breakdown).
8. **Implemente o Google OAuth combinado** (Google Ads + GA4 no mesmo flow):
   - Um authorize com dois scopes
   - Callback cria 1 ou 2 connections (GOOGLE_ADS e/ou GOOGLE_ANALYTICS)
   - `GoogleAdsAdapter` para métricas de ads
   - `GoogleAnalyticsAdapter` para sessões, tráfego por source/medium, e-commerce events
9. **Implemente o `NuvemshopAdapter`** (OAuth + fetch orders com UTM data).
10. **Implemente o `MercadoLivreAdapter`** (OAuth + fetch orders + webhook para orders_v2).
11. **Configure BullMQ** com Redis para os jobs de sync (ad-metrics a cada 6h, analytics a cada 6h, orders a cada 2h).

### FASE 3 — TikTok, IA e Dashboard (Semana 3)
12. **Implemente o TikTok Ads OAuth + Adapter** (authorize → callback → fetch reporting metrics por campaign).
13. **Implemente o Dashboard Service** com CRUZAMENTO DE DADOS:
    - KPIs consolidados por workspace (total spend, total revenue, ROAS geral)
    - ROAS Real: cruzamento de spend (Ads) × pedidos pagos (Nuvemshop/ML) via UTM attribution
    - Funil cross-platform: Impressão (Ads) → Clique (Ads) → Sessão (GA4) → Add to Cart (GA4) → Checkout → Pedido Pago
    - Comparativo de canais: Meta vs Google vs TikTok vs ML — spend, revenue, ROAS, CPA lado a lado
    - Validação de conversão: conversões reportadas pelos Ads vs transações reais no GA4 vs pedidos na loja
    - Tráfego por fonte: GA4 source/medium breakdown mostrando contribuição de cada canal
14. **Implemente o AI Service** com integração Claude API:
    - Endpoint POST /ai/analyze que consolida dados de TODAS as plataformas conectadas no workspace
    - Endpoint POST /ai/ask para perguntas livres sobre os dados cruzados
    - Prompts estruturados que incluem dados de ads + analytics + pedidos + funil juntos
    - A IA SEMPRE cruza os dados entre si — nunca analisa uma plataforma isolada
    - Parsing da resposta em AIInsight com severity e recommendation
15. **Implemente o Alert Service** com detecção de anomalias cross-platform (ROAS drop, CPA spike, discrepância de conversão entre Ads e GA4, etc).
16. **No frontend**, crie todas as páginas:
    - Login/Register
    - Lista de Workspaces (subcontas) com card por cliente
    - Setup do Workspace — checklist visual: "Conecte as plataformas do seu cliente"
      Ícones: Meta Ads, Google (Ads+GA4), TikTok Ads, Nuvemshop, Mercado Livre
    - Dashboard principal com:
      * KPI cards (spend total, revenue total, ROAS real, CPA médio)
      * Gráfico de ROAS Real vs ROAS Reportado
      * Funil cross-platform (impressão → sessão → cart → checkout → pedido)
      * Comparativo de canais (barras lado a lado)
      * Tabela de campanhas com métricas cruzadas
    - **Copilot Panel** — painel lateral fixo com:
      * Últimos insights da IA
      * Badges de severity (🔴 crítico, 🟡 atenção, 🟢 oportunidade)
      * Input "Pergunte ao copiloto" para perguntas livres
    - Página de Alertas
    - Página de Connections com status por plataforma

### FASE 4 — Billing e Polish (Semana 4)
17. **Implemente o Billing Service** com dual gateway:
    - Asaas provider (criar customer, criar subscription, webhook handler)
    - Stripe provider (criar customer, criar subscription, webhook handler)
    - Lógica de trial (14 dias com acesso Pro), upgrade/downgrade, inadimplência
18. **Implemente enforcement de limites** (max subcontas por plano, créditos de IA por plano).
19. **Configure docker-compose** para dev local.
20. **Deploy no Easypanel** (Dockerfile para api e web).
21. **Landing page** em /web com hero, features, pricing, CTA para trial.

### O QUE NÃO IMPLEMENTAR NO MVP:
- Client portal (workspace role VIEWER) — futuro
- Exportação de relatório PDF — futuro
- Shopify adapter — mês 2
- Amazon SP-API adapter — mês 2-3
- Shopee adapter — mês 3
- Loja Integrada adapter — mês 3
- Multi-idioma — futuro
- App mobile — futuro

### PRIORIDADE ABSOLUTA:
O fluxo core que precisa funcionar no dia 1:
1. Gestor cria conta → cria subconta "Cliente X"
2. Conecta Meta Ads + Nuvemshop + Google (Ads+GA4) desse cliente
3. Dados sincronizam automaticamente
4. Dashboard mostra ROAS real CRUZADO (spend do Meta × pedidos pagos na Nuvemshop × sessões do GA4)
5. IA gera insight cruzando TODAS as fontes: "Seu ROAS real é X, não Y. O GA4 confirma Z sessões com transação. Aqui está o porquê e o que fazer."

---

## 🛡️ ADENDO: RESILIÊNCIA E OBSERVABILIDADE (ANTIFRAGILIDADE)

Implementar as seguintes camadas de segurança técnica para garantir a estabilidade do SaaS:

### 1. Stale-While-Revalidate (Soberania de Dados)
- O Dashboard **nunca** deve fazer requisições diretas às APIs externas em tempo real.
- Toda visualização deve ser alimentada pelo banco local (PostgreSQL).
- Se um Adapter falhar, o sistema deve realizar **Graceful Degradation**: exibir o último dado disponível com um alerta visual: `"Dados de [Plataforma] atualizados há X horas. Tentando reconectar..."`.

### 2. Monitoramento Proativo (Circuit Breaker & Alerts)
- Configurar o BullMQ para que, após **3 falhas consecutivas** de um job de sync, o status da `Connection` mude para `ERROR`.
- Criar um **Webhook de Notificação Crítica** (Slack/Discord/WhatsApp) que avise o administrador sobre falhas sistemáticas em conexões antes que o usuário perceba.

### 3. Gestão de Versionamento de APIs
- Centralizar as versões das APIs (ex: `v21.0` do Meta) em variáveis de ambiente ou em um arquivo de configuração global em `apps/api`.
- O `BasePlatformAdapter` deve incluir um método `healthCheck` para validar se o token e a versão da API ainda estão operacionais.

### 4. Rate Limiting & Retries
- Implementar **Exponential Backoff** nos retries das filas para evitar bloqueios por excesso de requisições (Rate Limit) nas plataformas.

Se esse fluxo de cruzamento funcionar, o produto tem valor. Todo o resto é otimização.
