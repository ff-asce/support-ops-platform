# SupportOps Platform

A full-stack internal call-center tooling dashboard demonstrating enterprise-grade architecture, API design, observability, and AI-assisted workflows.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Client                           │
│          React + TypeScript SPA (Vite)                  │
│   Apollo Client · Tailwind CSS · React Query            │
└────────────────────┬────────────────────────────────────┘
                     │  GraphQL over HTTP
┌────────────────────▼────────────────────────────────────┐
│                   API Gateway Service                   │
│         Node.js · Express · Apollo Server               │
│         GraphQL schema (SDL-first)                      │
│         JWT auth middleware                             │
│         Request-level structured logging (Pino)         │
│         Prometheus metrics endpoint /metrics            │
└────┬──────────────────────────┬──────────────────────────┘
     │ REST/internal            │ REST/internal
┌────▼────────────┐   ┌─────────▼───────────────────────┐
│  Ticket Service │   │     AI Resolution Service        │
│  Node.js/Express│   │     Node.js/Express              │
│  MongoDB (via   │   │     Calls Anthropic API          │
│  Mongoose)      │   │     Caches suggestions in Mongo  │
└────┬────────────┘   └─────────────────────────────────┘
     │
┌────▼──────────┐
│   MongoDB     │
│  (local /     │
│  Atlas free)  │
└───────────────┘
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Apollo Client, Tailwind CSS
- **Backend**: Node.js, Express, Apollo Server, GraphQL
- **Database**: MongoDB with Mongoose ODM
- **AI**: Anthropic Claude API
- **Observability**: Pino (structured logging), Prometheus metrics
- **Monorepo**: npm workspaces + Turborepo
- **Testing**: Vitest, Supertest, mongodb-memory-server
- **CI/CD**: GitHub Actions

## Project Structure

```
support-ops-platform/
├── packages/
│   ├── shared/                  # Shared TS types, Zod schemas, error codes
│   ├── api-gateway/             # Apollo Server + Express gateway
│   ├── ticket-service/          # Ticket CRUD + domain logic
│   └── ai-resolution-service/   # Anthropic API integration
├── apps/
│   └── web/                     # React SPA
├── docker-compose.yml           # Local development orchestration
├── .github/workflows/           # CI/CD pipelines
├── package.json                 # Workspace root
└── turbo.json                   # Turborepo configuration
```

## Quick Start

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)
- Anthropic API key

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/support-ops-platform
cd support-ops-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI, JWT secret, and Anthropic API key

# Start all services with Docker Compose (recommended)
docker compose up

# OR start services manually
npm run dev --workspace=packages/ticket-service
npm run dev --workspace=packages/ai-resolution-service
npm run dev --workspace=packages/api-gateway
npm run dev --workspace=apps/web

# Seed the database with sample data
npm run seed
```

### Access Points

- **Web App**: http://localhost:5173
- **API Gateway**: http://localhost:3000/graphql
- **Ticket Service**: http://localhost:3001 (internal)
- **AI Service**: http://localhost:3002 (internal)

## Design Decisions

### Why GraphQL at the Gateway?

The API gateway uses GraphQL to provide a flexible, type-safe API for the frontend while abstracting the complexity of multiple backend services. This BFF (Backend for Frontend) pattern allows:

- **Efficient data fetching**: Clients request exactly what they need
- **Type safety**: SDL-first schema provides compile-time guarantees
- **Service orchestration**: Gateway resolves data from multiple services
- **Evolution**: Add fields without breaking existing clients

### Why MongoDB?

MongoDB is ideal for this workload because:

- **Flexible schema**: Ticket metadata can evolve without migrations
- **Document model**: Audit log as embedded array is natural and performant
- **Rich queries**: Compound indexes support complex queue filtering
- **Text search**: Built-in full-text search for ticket content

### DataLoader Pattern

The gateway uses DataLoader to batch and cache agent lookups when resolving ticket lists, preventing N+1 queries:

```typescript
// Without DataLoader: N+1 queries
tickets.forEach(ticket => {
  agent = await fetchAgent(ticket.assignedAgentId); // N queries
});

// With DataLoader: 2 queries total
const agents = await agentLoader.loadMany(agentIds); // 1 batched query
```

### AI Degradation Strategy

The AI service never blocks the core workflow. If Anthropic API fails:

1. Return cached suggestion if available
2. Otherwise return `{ degraded: true }` response
3. Log error for monitoring
4. Allow agents to continue without AI assistance

This ensures the platform remains operational even when external dependencies fail.

### Status Transition State Machine

Ticket status changes are validated through a state machine, not ad-hoc conditionals:

```typescript
const VALID_TRANSITIONS = {
  open: ["pending", "escalated"],
  pending: ["resolved", "escalated"],
  resolved: [], // Terminal state
  escalated: ["resolved"],
};
```

This prevents invalid transitions (e.g., `resolved → open`) and makes business rules explicit and testable.

## Testing Strategy

| Layer | Tool | Coverage |
|-------|------|----------|
| Unit | Vitest | Status transitions, Zod validation, AI response parsing |
| Integration | Vitest + mongodb-memory-server | Ticket CRUD, audit logging, agent counters |
| API | Vitest + supertest | GraphQL operations, auth middleware |
| E2E | Playwright (optional) | Critical user flows |

**Target**: 70%+ coverage on business logic

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests for specific package
npm test --workspace=packages/ticket-service
```

## Observability

### Structured Logging

All services use Pino with consistent schema:

```json
{
  "level": "info",
  "time": "2024-01-15T10:30:00.000Z",
  "service": "ticket-service",
  "requestId": "uuid-here",
  "msg": "Ticket created",
  "ticketId": "TKT-000042"
}
```

### Request Tracing

The gateway generates a UUID per request and forwards it as `X-Request-ID` to downstream services, enabling end-to-end tracing across logs.

### Metrics

The gateway exposes Prometheus metrics at `/metrics`:

- `graphql_requests_total` (counter)
- `graphql_request_duration_seconds` (histogram)
- `ai_suggestion_requests_total` (counter)

### Health Checks

All services expose `GET /health`:

```json
{
  "status": "ok",
  "db": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

The gateway aggregates downstream health checks.

## Development

### Code Style

```bash
# Lint all packages
npm run lint

# Type check
npm run typecheck

# Build all packages
npm run build
```

### Adding a New Service

1. Create package in `packages/`
2. Add to workspace in root `package.json`
3. Define dependencies and scripts
4. Add to `docker-compose.yml`
5. Update gateway to call new service

## What's Missing / Future Work

This project demonstrates core architecture but intentionally excludes:

- **Rate limiting**: Would add express-rate-limit or Redis-based limiter
- **RBAC**: Currently only agent/supervisor roles; needs fine-grained permissions
- **WebSocket session management**: Subscriptions work but need reconnection logic
- **Distributed tracing**: Would integrate OpenTelemetry for full observability
- **File attachments**: Would add S3 integration for ticket attachments
- **Email notifications**: Would integrate SendGrid or similar
- **Multi-tenancy**: Single-tenant design; would need tenant isolation
- **Production deployment**: Docker Compose is dev-only; would use Kubernetes

## License

MIT

## Author

Built as a portfolio project demonstrating SE3-level architecture and implementation skills.