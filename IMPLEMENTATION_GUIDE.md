# SupportOps Platform - Implementation Guide

## What's Been Created

### ✅ Completed

1. **Monorepo Structure**
   - Root package.json with npm workspaces
   - Turborepo configuration
   - .gitignore and .env.example

2. **Shared Package** (`packages/shared/`)
   - TypeScript types for all entities
   - Zod validation schemas
   - Error codes and AppError class
   - Fully typed and ready to use

3. **Ticket Service - Partial** (`packages/ticket-service/`)
   - Package.json with all dependencies
   - TypeScript configuration
   - Mongoose models (Ticket, Agent)
   - Utility functions (logger, database, status transitions)
   - Error handler middleware

4. **Documentation**
   - Comprehensive README with architecture decisions
   - This implementation guide

### 🚧 Remaining Work

The following components need to be implemented to complete the project:

## 1. Complete Ticket Service

### Routes to Implement (`packages/ticket-service/src/routes/`)

**tickets.ts** - Ticket CRUD operations:
```typescript
GET    /tickets              - List tickets with filters
GET    /tickets/:id          - Get single ticket
POST   /tickets              - Create ticket
PATCH  /tickets/:id/status   - Update status
PATCH  /tickets/:id/assign   - Assign to agent
PATCH  /tickets/:id/resolve  - Mark resolved
PATCH  /tickets/:id/ai-suggestion - Store AI suggestion
```

**agents.ts** - Agent operations:
```typescript
GET    /agents/:id           - Get agent details
POST   /agents               - Create agent (for seeding)
```

**health.ts** - Health check:
```typescript
GET    /health               - Service health status
```

### Main Server (`packages/ticket-service/src/index.ts`)

Create Express app with:
- CORS middleware
- JSON body parser
- Request logging middleware
- Route mounting
- Error handler
- Database connection
- Graceful shutdown

### Seed Script (`packages/ticket-service/src/scripts/seed.ts`)

Create sample data:
- 3-5 agents with hashed passwords
- 20-30 tickets with various statuses
- Realistic customer IDs and descriptions

## 2. AI Resolution Service

### Structure (`packages/ai-resolution-service/`)

**package.json** - Dependencies:
- express, @anthropic-ai/sdk
- mongoose (for caching)
- pino, dotenv
- Same dev dependencies as ticket-service

**src/prompts/resolution.ts** - Prompt template:
```typescript
export function buildPrompt(category, subject, description) {
  return `You are an expert customer service resolution assistant...`;
}
```

**src/models/AISuggestionCache.ts** - MongoDB model:
```typescript
{
  ticketId: string,
  suggestion: AISuggestionResponse,
  expiresAt: Date, // TTL index: 1 hour
}
```

**src/routes/suggest.ts** - Main endpoint:
```typescript
POST /suggest
- Check cache
- Call Anthropic if needed
- Parse and validate response
- Cache result
- Return suggestion or degraded response
```

**src/index.ts** - Express server similar to ticket-service

## 3. API Gateway

### Structure (`packages/api-gateway/`)

**package.json** - Dependencies:
- @apollo/server, express
- graphql, @graphql-tools/schema
- jsonwebtoken, bcrypt
- dataloader
- prom-client (Prometheus)
- axios (for internal service calls)

**src/schema/typeDefs.ts** - GraphQL SDL:
```graphql
type Query {
  ticket(id: ID!): Ticket
  tickets(filter: TicketFilter, pagination: PaginationInput): TicketPage!
  agent(id: ID!): Agent
  me: Agent
}

type Mutation {
  createTicket(input: CreateTicketInput!): Ticket!
  updateTicketStatus(id: ID!, status: TicketStatus!, note: String): Ticket!
  assignTicket(id: ID!, agentId: ID!): Ticket!
  resolveTicket(id: ID!, resolution: String!): Ticket!
  requestAISuggestion(ticketId: ID!): AISuggestion!
  acceptAISuggestion(ticketId: ID!, accepted: Boolean!): Ticket!
  login(email: String!, password: String!): AuthPayload!
}

type Subscription {
  ticketUpdated(id: ID!): Ticket!
}
```

**src/resolvers/** - Implement all resolvers:
- Query resolvers call ticket-service
- Mutation resolvers call ticket-service and ai-service
- Use DataLoader for agent batching
- Subscriptions use PubSub

**src/middleware/auth.ts** - JWT verification:
```typescript
- Extract token from Authorization header
- Verify JWT
- Attach agent to context
- Reject if invalid
```

**src/dataloaders/agentLoader.ts** - Batch agent fetching

**src/metrics.ts** - Prometheus metrics setup

**src/index.ts** - Apollo Server with Express

## 4. React Frontend

### Structure (`apps/web/`)

**package.json** - Dependencies:
- react, react-dom, react-router-dom
- @apollo/client, graphql
- @tanstack/react-query
- tailwindcss, autoprefixer, postcss
- vite, @vitejs/plugin-react

**src/apollo/client.ts** - Apollo Client setup:
```typescript
- HTTP link to gateway
- WebSocket link for subscriptions
- Auth link (add JWT to headers)
- Error link
- Cache configuration
```

**src/pages/**:
- LoginPage.tsx
- DashboardPage.tsx
- CreateTicketPage.tsx
- TicketDetailPage.tsx
- AgentsPage.tsx

**src/components/**:
- TicketQueueTable.tsx
- TicketHeader.tsx
- AuditLogTimeline.tsx
- AIAssistPanel.tsx
- MetricsBar.tsx

**src/graphql/** - GraphQL queries and mutations

**tailwind.config.js** - Tailwind configuration

**vite.config.ts** - Vite configuration

## 5. Docker Compose

**docker-compose.yml**:
```yaml
services:
  mongodb:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: [mongo-data:/data/db]

  ticket-service:
    build: ./packages/ticket-service
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/support-ops
    depends_on: [mongodb]

  ai-resolution-service:
    build: ./packages/ai-resolution-service
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/support-ops
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on: [mongodb]

  api-gateway:
    build: ./packages/api-gateway
    ports: ["3000:3000"]
    environment:
      - TICKET_SERVICE_URL=http://ticket-service:3001
      - AI_SERVICE_URL=http://ai-resolution-service:3002
      - JWT_SECRET=${JWT_SECRET}
    depends_on: [ticket-service, ai-resolution-service]

  web:
    build: ./apps/web
    ports: ["5173:5173"]
    depends_on: [api-gateway]
```

Each service needs a Dockerfile.

## 6. Testing

### Unit Tests (Vitest)

**packages/ticket-service/src/__tests__/**:
- `statusTransitions.test.ts` - Test state machine
- `models.test.ts` - Test Mongoose models

### Integration Tests

**packages/ticket-service/src/__tests__/integration/**:
- `tickets.test.ts` - Test CRUD endpoints with mongodb-memory-server
- `agents.test.ts` - Test agent endpoints

### API Tests

**packages/api-gateway/src/__tests__/**:
- `auth.test.ts` - Test JWT authentication
- `queries.test.ts` - Test GraphQL queries
- `mutations.test.ts` - Test GraphQL mutations

## 7. CI/CD

**.github/workflows/ci.yml**:
```yaml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: turbo run lint typecheck test --parallel
      - run: docker compose build
```

## Quick Implementation Order

1. **Complete ticket-service** (4-6 hours)
   - Implement routes
   - Create main server
   - Write seed script
   - Test manually with curl/Postman

2. **Build ai-resolution-service** (3-4 hours)
   - Set up Anthropic client
   - Implement caching
   - Create suggest endpoint
   - Test with sample tickets

3. **Create api-gateway** (6-8 hours)
   - Define GraphQL schema
   - Implement resolvers
   - Add authentication
   - Set up DataLoader
   - Add metrics

4. **Build React frontend** (10-15 hours)
   - Set up routing
   - Create pages and components
   - Implement Apollo Client
   - Style with Tailwind
   - Add real-time subscriptions

5. **Docker Compose** (2-3 hours)
   - Write Dockerfiles
   - Configure docker-compose.yml
   - Test full stack locally

6. **Testing** (6-8 hours)
   - Write unit tests
   - Write integration tests
   - Achieve 70%+ coverage

7. **CI/CD** (2-3 hours)
   - Set up GitHub Actions
   - Configure workflows
   - Test pipeline

## Estimated Total Time

- **Minimum (experienced developer)**: 35-40 hours
- **Comfortable pace**: 50-60 hours
- **Learning included**: 70-80 hours

## Next Steps

1. Install dependencies: `npm install`
2. Set up .env file with your credentials
3. Start with ticket-service implementation
4. Test each service independently before integration
5. Use the README for architecture guidance

## Resources

- [Apollo Server Docs](https://www.apollographql.com/docs/apollo-server/)
- [Mongoose Docs](https://mongoosejs.com/docs/)
- [Anthropic API Docs](https://docs.anthropic.com/)
- [React Router Docs](https://reactrouter.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/)

## Support

This is a portfolio project demonstrating SE3-level architecture. The foundation is solid - the remaining implementation follows standard patterns documented in the README.