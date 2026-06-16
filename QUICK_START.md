# Quick Start Guide - SupportOps Platform

Get the SupportOps Platform running in under 5 minutes!

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 20+** - [Download here](https://nodejs.org/)
- **Docker & Docker Compose** - [Download here](https://www.docker.com/products/docker-desktop)
- **Git** - [Download here](https://git-scm.com/)
- **Anthropic API Key** (optional for AI features) - [Get one here](https://console.anthropic.com/)

## 🚀 Installation Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/ff-asce/support-ops-platform.git
cd support-ops-platform
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all dependencies for all packages in the monorepo.

### Step 3: Set Up Environment Variables

Create environment files for each service:

**Ticket Service** (`packages/ticket-service/.env`):
```bash
PORT=3001
MONGODB_URI=mongodb://localhost:27017/supportops
NODE_ENV=development
```

**AI Resolution Service** (`packages/ai-resolution-service/.env`):
```bash
PORT=3002
MONGODB_URI=mongodb://localhost:27017/supportops
ANTHROPIC_API_KEY=your_api_key_here
NODE_ENV=development
```

**API Gateway** (`packages/api-gateway/.env`):
```bash
PORT=3000
TICKET_SERVICE_URL=http://localhost:3001
AI_SERVICE_URL=http://localhost:3002
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
```

> 💡 **Tip**: You can skip the Anthropic API key for now. The AI service will gracefully degrade and return fallback responses.

### Step 4: Start the Services

**Option A: Using Docker Compose (Recommended)**

```bash
docker-compose up
```

This will start:
- MongoDB on port 27017
- Ticket Service on port 3001
- AI Resolution Service on port 3002
- API Gateway on port 3000

**Option B: Manual Start (for development)**

Open 4 terminal windows and run:

```bash
# Terminal 1 - Start MongoDB
docker run -d -p 27017:27017 --name mongodb mongo:7

# Terminal 2 - Ticket Service
npm run dev --workspace=packages/ticket-service

# Terminal 3 - AI Resolution Service
npm run dev --workspace=packages/ai-resolution-service

# Terminal 4 - API Gateway
npm run dev --workspace=packages/api-gateway
```

### Step 5: Seed the Database

In a new terminal, run:

```bash
npm run seed --workspace=packages/ticket-service
```

This creates:
- 5 sample agents
- 20 sample tickets with various statuses
- Realistic ticket data

## ✅ Verify Installation

### Check Service Health

```bash
# Ticket Service
curl http://localhost:3001/health

# AI Resolution Service
curl http://localhost:3002/health

# API Gateway
curl http://localhost:3000/health
```

All should return `{"status":"ok"}`.

### Access GraphQL Playground

Open your browser to:
```
http://localhost:3000/graphql
```

You should see the Apollo Server GraphQL Playground.

## 🎮 Try It Out!

### 1. Login to Get JWT Token

In the GraphQL Playground, run:

```graphql
mutation {
  login(email: "alice@example.com", password: "password123") {
    token
    agent {
      id
      name
      email
    }
  }
}
```

Copy the `token` from the response.

### 2. Set Authorization Header

In the GraphQL Playground, click "HTTP HEADERS" at the bottom and add:

```json
{
  "Authorization": "Bearer YOUR_TOKEN_HERE"
}
```

### 3. Query Tickets

```graphql
query {
  tickets(limit: 5) {
    tickets {
      id
      subject
      status
      priority
      assignedTo {
        name
        email
      }
    }
    total
    hasMore
  }
}
```

### 4. Get AI Suggestion

```graphql
mutation {
  getAISuggestion(ticketId: "TKT-000001") {
    suggestion
    confidence
    degraded
  }
}
```

### 5. Update Ticket Status

```graphql
mutation {
  updateTicketStatus(
    ticketId: "TKT-000001"
    status: PENDING
    agentId: "agent-1"
  ) {
    id
    status
    auditLog {
      action
      performedBy {
        name
      }
      timestamp
    }
  }
}
```

## 📊 Monitoring & Observability

### View Logs

All services use structured logging with Pino:

```bash
# View ticket service logs
docker-compose logs -f ticket-service

# View all logs
docker-compose logs -f
```

### Prometheus Metrics

Access metrics at:
```
http://localhost:3000/metrics
```

Metrics include:
- `graphql_requests_total` - Total GraphQL requests
- `graphql_request_duration_seconds` - Request latency
- `ai_suggestion_requests_total` - AI suggestion requests

## 🧪 Run Tests

```bash
# Run all tests
npm test

# Run tests for specific package
npm test --workspace=packages/ticket-service

# Run with coverage
npm run test:coverage --workspace=packages/ticket-service
```

## 🛠️ Development Commands

```bash
# Lint all packages
npm run lint

# Type check all packages
npm run typecheck

# Build all packages
npm run build

# Clean build artifacts
npm run clean
```

## 🐛 Troubleshooting

### MongoDB Connection Issues

**Problem**: `MongoServerError: connect ECONNREFUSED`

**Solution**:
```bash
# Check if MongoDB is running
docker ps | grep mongo

# Restart MongoDB
docker-compose restart mongodb
```

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Find process using the port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### TypeScript Compilation Errors

**Problem**: `error TS2307: Cannot find module '@support-ops/shared'`

**Solution**:
```bash
# Rebuild shared package
npm run build --workspace=packages/shared

# Rebuild all packages
npm run build
```

### AI Service Returns Degraded Responses

**Problem**: `{ "degraded": true }` in AI suggestions

**Solution**:
- Check if you've set `ANTHROPIC_API_KEY` in `.env`
- Verify your API key is valid
- Check AI service logs: `docker-compose logs ai-resolution-service`

## 📚 Next Steps

- Read the [Architecture Documentation](./README.md#architecture)
- Explore the [Implementation Guide](./IMPLEMENTATION_GUIDE.md)
- Check the [Project Status](./PROJECT_STATUS.md)
- Review the [GraphQL Schema](./packages/api-gateway/src/schema/typeDefs.ts)

## 🆘 Getting Help

- Check the [Troubleshooting](#-troubleshooting) section above
- Review service logs: `docker-compose logs -f`
- Check health endpoints: `curl http://localhost:3000/health`
- Open an issue on GitHub

## 🎉 Success!

You now have a fully functional SupportOps Platform running locally. Happy coding!