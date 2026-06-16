# API Documentation - SupportOps Platform

Complete API reference for all services in the SupportOps Platform.

## Table of Contents

- [API Gateway (GraphQL)](#api-gateway-graphql)
- [Ticket Service (REST)](#ticket-service-rest)
- [AI Resolution Service (REST)](#ai-resolution-service-rest)
- [Authentication](#authentication)
- [Error Handling](#error-handling)

---

## API Gateway (GraphQL)

**Base URL**: `http://localhost:3000/graphql`  
**Protocol**: GraphQL over HTTP  
**Authentication**: JWT Bearer token (except for login mutation)

### Authentication

#### Login

Get a JWT token for authentication.

```graphql
mutation {
  login(email: "alice@example.com", password: "password123") {
    token
    agent {
      id
      name
      email
      role
    }
  }
}
```

**Response**:
```json
{
  "data": {
    "login": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "agent": {
        "id": "agent-1",
        "name": "Alice Johnson",
        "email": "alice@example.com",
        "role": "AGENT"
      }
    }
  }
}
```

**Use the token in subsequent requests**:
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Queries

#### Get Current Agent

```graphql
query {
  me {
    id
    name
    email
    role
    activeTickets
    resolvedToday
  }
}
```

#### List Tickets

```graphql
query {
  tickets(
    status: OPEN
    priority: HIGH
    limit: 10
    offset: 0
  ) {
    tickets {
      id
      subject
      description
      status
      priority
      createdAt
      updatedAt
      assignedTo {
        id
        name
        email
      }
      resolution {
        resolvedAt
        resolvedBy {
          name
        }
        notes
      }
    }
    total
    hasMore
  }
}
```

**Parameters**:
- `status` (optional): `OPEN`, `PENDING`, `RESOLVED`, `ESCALATED`
- `priority` (optional): `LOW`, `MEDIUM`, `HIGH`, `URGENT`
- `assignedAgentId` (optional): Filter by assigned agent
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

#### Get Single Ticket

```graphql
query {
  ticket(id: "TKT-000001") {
    id
    subject
    description
    status
    priority
    customerEmail
    customerName
    createdAt
    updatedAt
    assignedTo {
      id
      name
      email
    }
    resolution {
      resolvedAt
      resolvedBy {
        name
      }
      notes
      aiSuggestionUsed
    }
    auditLog {
      action
      performedBy {
        name
      }
      timestamp
      details
    }
  }
}
```

#### Get Agent

```graphql
query {
  agent(id: "agent-1") {
    id
    name
    email
    role
    activeTickets
    resolvedToday
    tickets(status: OPEN) {
      id
      subject
      priority
      createdAt
    }
  }
}
```

#### List Agents

```graphql
query {
  agents {
    id
    name
    email
    role
    activeTickets
    resolvedToday
  }
}
```

### Mutations

#### Create Ticket

```graphql
mutation {
  createTicket(input: {
    subject: "Cannot access account"
    description: "User reports being locked out after password reset"
    priority: HIGH
    customerEmail: "customer@example.com"
    customerName: "John Doe"
  }) {
    id
    subject
    status
    priority
    createdAt
  }
}
```

#### Assign Ticket

```graphql
mutation {
  assignTicket(
    ticketId: "TKT-000001"
    agentId: "agent-1"
  ) {
    id
    status
    assignedTo {
      name
      email
    }
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

#### Update Ticket Status

```graphql
mutation {
  updateTicketStatus(
    ticketId: "TKT-000001"
    status: PENDING
    agentId: "agent-1"
  ) {
    id
    status
    updatedAt
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

**Valid Status Transitions**:
- `OPEN` → `PENDING`, `ESCALATED`
- `PENDING` → `RESOLVED`, `ESCALATED`
- `ESCALATED` → `RESOLVED`
- `RESOLVED` → (terminal state)

#### Resolve Ticket

```graphql
mutation {
  resolveTicket(
    ticketId: "TKT-000001"
    agentId: "agent-1"
    notes: "Issue resolved by resetting password and clearing cache"
    aiSuggestionUsed: true
  ) {
    id
    status
    resolution {
      resolvedAt
      resolvedBy {
        name
      }
      notes
      aiSuggestionUsed
    }
  }
}
```

#### Get AI Suggestion

```graphql
mutation {
  getAISuggestion(ticketId: "TKT-000001") {
    suggestion
    confidence
    degraded
    cachedAt
  }
}
```

**Response (Success)**:
```json
{
  "data": {
    "getAISuggestion": {
      "suggestion": "Based on the ticket description, try these steps:\n1. Reset the user's password\n2. Clear browser cache\n3. Check account status",
      "confidence": 0.85,
      "degraded": false,
      "cachedAt": null
    }
  }
}
```

**Response (Degraded)**:
```json
{
  "data": {
    "getAISuggestion": {
      "suggestion": "AI service temporarily unavailable. Please proceed with manual resolution.",
      "confidence": 0,
      "degraded": true,
      "cachedAt": null
    }
  }
}
```

### Subscriptions

#### Subscribe to Ticket Updates

```graphql
subscription {
  ticketUpdated {
    id
    subject
    status
    priority
    updatedAt
    assignedTo {
      name
    }
  }
}
```

**Use Case**: Real-time dashboard updates when tickets are created, assigned, or resolved.

---

## Ticket Service (REST)

**Base URL**: `http://localhost:3001`  
**Protocol**: REST/HTTP  
**Authentication**: Internal service (not exposed publicly)

### Endpoints

#### Health Check

```bash
GET /health
```

**Response**:
```json
{
  "status": "ok",
  "db": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### List Tickets

```bash
GET /tickets?status=open&priority=high&limit=10&offset=0
```

**Query Parameters**:
- `status` (optional): open, pending, resolved, escalated
- `priority` (optional): low, medium, high, urgent
- `assignedAgentId` (optional): Filter by agent
- `limit` (optional): Default 50
- `offset` (optional): Default 0

**Response**:
```json
{
  "tickets": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "ticketId": "TKT-000001",
      "subject": "Cannot access account",
      "description": "User locked out",
      "status": "open",
      "priority": "high",
      "customerEmail": "customer@example.com",
      "customerName": "John Doe",
      "assignedAgentId": null,
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "total": 42
}
```

#### Get Single Ticket

```bash
GET /tickets/:ticketId
```

**Response**: Same as ticket object above, plus `auditLog` and `resolution` if available.

#### Create Ticket

```bash
POST /tickets
Content-Type: application/json

{
  "subject": "Cannot access account",
  "description": "User reports being locked out",
  "priority": "high",
  "customerEmail": "customer@example.com",
  "customerName": "John Doe"
}
```

#### Update Ticket Status

```bash
PATCH /tickets/:ticketId/status
Content-Type: application/json

{
  "status": "pending",
  "agentId": "agent-1"
}
```

#### Assign Ticket

```bash
PATCH /tickets/:ticketId/assign
Content-Type: application/json

{
  "agentId": "agent-1"
}
```

#### Resolve Ticket

```bash
PATCH /tickets/:ticketId/resolve
Content-Type: application/json

{
  "agentId": "agent-1",
  "notes": "Issue resolved by resetting password",
  "aiSuggestionUsed": true
}
```

#### Store AI Suggestion

```bash
PATCH /tickets/:ticketId/ai-suggestion
Content-Type: application/json

{
  "suggestion": "Try resetting the password",
  "confidence": 0.85
}
```

#### Get Agent

```bash
GET /agents/:agentId
```

#### Get Agent Tickets

```bash
GET /agents/:agentId/tickets?status=open
```

#### List All Agents

```bash
GET /agents
```

---

## AI Resolution Service (REST)

**Base URL**: `http://localhost:3002`  
**Protocol**: REST/HTTP  
**Authentication**: Internal service (not exposed publicly)

### Endpoints

#### Health Check

```bash
GET /health
```

**Response**:
```json
{
  "status": "ok",
  "anthropic": "available",
  "db": "connected",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### Get AI Suggestion

```bash
POST /suggest
Content-Type: application/json

{
  "ticketId": "TKT-000001",
  "subject": "Cannot access account",
  "description": "User reports being locked out after password reset",
  "priority": "high"
}
```

**Response (Success)**:
```json
{
  "suggestion": "Based on the ticket description, try these steps:\n1. Reset the user's password\n2. Clear browser cache\n3. Check account status",
  "confidence": 0.85,
  "degraded": false,
  "cachedAt": null
}
```

**Response (Cached)**:
```json
{
  "suggestion": "...",
  "confidence": 0.85,
  "degraded": false,
  "cachedAt": "2024-01-15T10:25:00.000Z"
}
```

**Response (Degraded)**:
```json
{
  "suggestion": "AI service temporarily unavailable. Please proceed with manual resolution.",
  "confidence": 0,
  "degraded": true
}
```

**Caching**: Suggestions are cached for 1 hour per ticket to reduce API costs.

---

## Authentication

### JWT Token Structure

```json
{
  "agentId": "agent-1",
  "email": "alice@example.com",
  "role": "agent",
  "iat": 1705315200,
  "exp": 1705401600
}
```

**Token Expiry**: 24 hours

### Using JWT in Requests

**GraphQL (HTTP Headers)**:
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**REST (curl)**:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/graphql
```

---

## Error Handling

### GraphQL Errors

**Format**:
```json
{
  "errors": [
    {
      "message": "Ticket not found",
      "extensions": {
        "code": "NOT_FOUND",
        "ticketId": "TKT-999999"
      }
    }
  ]
}
```

**Common Error Codes**:
- `UNAUTHENTICATED` - Missing or invalid JWT token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `VALIDATION_ERROR` - Invalid input
- `INVALID_TRANSITION` - Invalid status transition
- `INTERNAL_ERROR` - Server error

### REST Errors

**Format**:
```json
{
  "code": "NOT_FOUND",
  "message": "Ticket not found",
  "details": {
    "ticketId": "TKT-999999"
  }
}
```

**HTTP Status Codes**:
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing auth)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Currently not implemented. In production, consider:
- 100 requests/minute per IP for GraphQL
- 1000 requests/minute for internal REST services
- Separate limits for AI suggestions (10/minute)

---

## Pagination

### GraphQL

Use `limit` and `offset`:

```graphql
query {
  tickets(limit: 20, offset: 40) {
    tickets { id }
    total
    hasMore
  }
}
```

### REST

Use query parameters:

```bash
GET /tickets?limit=20&offset=40
```

---

## Examples

### Complete Ticket Workflow

```graphql
# 1. Login
mutation {
  login(email: "alice@example.com", password: "password123") {
    token
  }
}

# 2. Create ticket
mutation {
  createTicket(input: {
    subject: "Cannot login"
    description: "User forgot password"
    priority: MEDIUM
    customerEmail: "user@example.com"
    customerName: "Jane Doe"
  }) {
    id
  }
}

# 3. Assign to agent
mutation {
  assignTicket(ticketId: "TKT-000042", agentId: "agent-1") {
    id
    status
  }
}

# 4. Get AI suggestion
mutation {
  getAISuggestion(ticketId: "TKT-000042") {
    suggestion
    confidence
  }
}

# 5. Update status
mutation {
  updateTicketStatus(
    ticketId: "TKT-000042"
    status: PENDING
    agentId: "agent-1"
  ) {
    id
    status
  }
}

# 6. Resolve ticket
mutation {
  resolveTicket(
    ticketId: "TKT-000042"
    agentId: "agent-1"
    notes: "Password reset link sent"
    aiSuggestionUsed: true
  ) {
    id
    status
    resolution {
      resolvedAt
      notes
    }
  }
}
```

---

## Testing with curl

### Login
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"mutation { login(email: \"alice@example.com\", password: \"password123\") { token } }"}'
```

### Query with Auth
```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query":"query { me { name email } }"}'
```

---

## WebSocket Subscriptions

**Endpoint**: `ws://localhost:3000/graphql`  
**Protocol**: GraphQL over WebSocket (graphql-ws)

**Example (JavaScript)**:
```javascript
import { createClient } from 'graphql-ws';

const client = createClient({
  url: 'ws://localhost:3000/graphql',
  connectionParams: {
    Authorization: 'Bearer YOUR_TOKEN'
  }
});

client.subscribe(
  {
    query: 'subscription { ticketUpdated { id subject status } }'
  },
  {
    next: (data) => console.log('Ticket updated:', data),
    error: (error) => console.error('Error:', error),
    complete: () => console.log('Subscription complete')
  }
);
```

---

## Additional Resources

- [GraphQL Schema](./packages/api-gateway/src/schema/typeDefs.ts)
- [Quick Start Guide](./QUICK_START.md)
- [Architecture Documentation](./README.md)
- [Implementation Guide](./IMPLEMENTATION_GUIDE.md)