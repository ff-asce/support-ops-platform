import { gql } from 'apollo-server-express';

export const typeDefs = gql`
  scalar DateTime

  type Query {
    """Get a single ticket by ID"""
    ticket(id: ID!): Ticket
    
    """List all tickets with optional filters"""
    tickets(
      status: TicketStatus
      priority: TicketPriority
      assignedTo: ID
      search: String
      limit: Int = 50
      offset: Int = 0
    ): TicketConnection!
    
    """Get a single agent by ID"""
    agent(id: ID!): Agent
    
    """List all agents"""
    agents: [Agent!]!
    
    """Get AI suggestion for a ticket"""
    aiSuggestion(ticketId: ID!): AISuggestion
    
    """Health check"""
    health: HealthStatus!
  }

  type Mutation {
    """Create a new ticket"""
    createTicket(input: CreateTicketInput!): Ticket!
    
    """Update ticket details"""
    updateTicket(id: ID!, input: UpdateTicketInput!): Ticket!
    
    """Update ticket status"""
    updateTicketStatus(id: ID!, status: TicketStatus!): Ticket!
    
    """Assign ticket to an agent"""
    assignTicket(id: ID!, agentId: ID!): Ticket!
    
    """Unassign ticket from agent"""
    unassignTicket(id: ID!): Ticket!
    
    """Resolve a ticket"""
    resolveTicket(id: ID!, input: ResolveTicketInput!): Ticket!
    
    """Create a new agent"""
    createAgent(input: CreateAgentInput!): Agent!
    
    """Update agent details"""
    updateAgent(id: ID!, input: UpdateAgentInput!): Agent!
    
    """Delete an agent"""
    deleteAgent(id: ID!): Boolean!
  }

  type Subscription {
    """Subscribe to ticket updates"""
    ticketUpdated(ticketId: ID): Ticket!
    
    """Subscribe to new tickets"""
    ticketCreated: Ticket!
    
    """Subscribe to ticket status changes"""
    ticketStatusChanged(ticketId: ID): TicketStatusUpdate!
  }

  """Ticket entity"""
  type Ticket {
    id: ID!
    ticketId: String!
    subject: String!
    description: String!
    status: TicketStatus!
    priority: TicketPriority!
    category: String!
    customerId: String!
    assignedTo: Agent
    tags: [String!]!
    resolution: Resolution
    auditLog: [AuditEntry!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  """Agent entity"""
  type Agent {
    id: ID!
    agentId: String!
    name: String!
    email: String!
    role: AgentRole!
    skills: [String!]!
    activeTickets: Int!
    resolvedTickets: Int!
    averageResolutionTime: Float
    createdAt: DateTime!
    updatedAt: DateTime!
    
    """Tickets assigned to this agent"""
    tickets(status: TicketStatus): [Ticket!]!
  }

  """Ticket resolution details"""
  type Resolution {
    resolvedBy: Agent!
    resolvedAt: DateTime!
    resolutionNotes: String!
    resolutionTime: Int!
    customerSatisfaction: Int
  }

  """Audit log entry"""
  type AuditEntry {
    timestamp: DateTime!
    action: String!
    performedBy: String!
    changes: String
  }

  """AI-generated suggestion"""
  type AISuggestion {
    ticketId: String!
    suggestedResponse: String!
    suggestedCategory: String
    suggestedPriority: TicketPriority
    confidence: Float!
    reasoning: String
    generatedAt: DateTime!
    cached: Boolean!
  }

  """Paginated ticket results"""
  type TicketConnection {
    tickets: [Ticket!]!
    total: Int!
    hasMore: Boolean!
  }

  """Ticket status update event"""
  type TicketStatusUpdate {
    ticketId: String!
    oldStatus: TicketStatus!
    newStatus: TicketStatus!
    updatedBy: String!
    timestamp: DateTime!
  }

  """Health status"""
  type HealthStatus {
    status: String!
    timestamp: DateTime!
    services: ServiceHealth!
  }

  """Service health details"""
  type ServiceHealth {
    ticketService: Boolean!
    aiService: Boolean!
    database: Boolean!
  }

  """Ticket status enum"""
  enum TicketStatus {
    OPEN
    PENDING
    IN_PROGRESS
    RESOLVED
    CLOSED
    REOPENED
  }

  """Ticket priority enum"""
  enum TicketPriority {
    LOW
    MEDIUM
    HIGH
    URGENT
  }

  """Agent role enum"""
  enum AgentRole {
    AGENT
    SENIOR_AGENT
    TEAM_LEAD
    MANAGER
  }

  """Input for creating a ticket"""
  input CreateTicketInput {
    subject: String!
    description: String!
    priority: TicketPriority!
    category: String!
    customerId: String!
    tags: [String!]
  }

  """Input for updating a ticket"""
  input UpdateTicketInput {
    subject: String
    description: String
    priority: TicketPriority
    category: String
    tags: [String!]
  }

  """Input for resolving a ticket"""
  input ResolveTicketInput {
    resolutionNotes: String!
    customerSatisfaction: Int
  }

  """Input for creating an agent"""
  input CreateAgentInput {
    name: String!
    email: String!
    role: AgentRole!
    skills: [String!]!
  }

  """Input for updating an agent"""
  input UpdateAgentInput {
    name: String
    email: String
    role: AgentRole
    skills: [String!]
  }
`;

