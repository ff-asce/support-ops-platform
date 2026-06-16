import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { connectDatabase, disconnectDatabase } from "../utils/database";
import { AgentModel } from "../models/Agent";
import { TicketModel } from "../models/Ticket";
import { logger } from "../utils/logger";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/support-ops";

async function seed() {
  try {
    await connectDatabase(MONGODB_URI);
    logger.info("Starting database seed...");

    // Clear existing data
    await AgentModel.deleteMany({});
    await TicketModel.deleteMany({});
    logger.info("Cleared existing data");

    // Create agents
    const password = await bcrypt.hash("password123", 10);
    
    const agents = await AgentModel.create([
      {
        name: "Alice Johnson",
        email: "alice@example.com",
        role: "supervisor",
        passwordHash: password,
        activeTickets: 0,
      },
      {
        name: "Bob Smith",
        email: "bob@example.com",
        role: "agent",
        passwordHash: password,
        activeTickets: 0,
      },
      {
        name: "Carol Williams",
        email: "carol@example.com",
        role: "agent",
        passwordHash: password,
        activeTickets: 0,
      },
      {
        name: "David Brown",
        email: "david@example.com",
        role: "agent",
        passwordHash: password,
        activeTickets: 0,
      },
    ]);

    logger.info({ count: agents.length }, "Created agents");

    // Create tickets
    const ticketData = [
      {
        priority: "high",
        category: "billing",
        subject: "Incorrect charge on my account",
        description: "I was charged $99.99 but my subscription should be $49.99. Please review and refund the difference.",
        customerId: "CUST-001",
        tags: ["refund", "billing-error"],
        status: "open",
      },
      {
        priority: "critical",
        category: "account",
        subject: "Cannot access my account",
        description: "I've been locked out of my account after multiple failed login attempts. Need immediate assistance.",
        customerId: "CUST-002",
        tags: ["locked-account", "urgent"],
        status: "open",
      },
      {
        priority: "medium",
        category: "shipping",
        subject: "Package not delivered",
        description: "My order #12345 shows as delivered but I never received it. Tracking says it was left at the door.",
        customerId: "CUST-003",
        tags: ["missing-package", "delivery"],
        status: "pending",
        assignedAgentId: agents[1].agentId,
      },
      {
        priority: "low",
        category: "returns",
        subject: "Return label request",
        description: "I'd like to return item #67890. Can you send me a prepaid return label?",
        customerId: "CUST-004",
        tags: ["return", "label"],
        status: "open",
      },
      {
        priority: "high",
        category: "billing",
        subject: "Subscription not cancelled",
        description: "I cancelled my subscription last month but was still charged. Please cancel and refund.",
        customerId: "CUST-005",
        tags: ["cancellation", "refund"],
        status: "pending",
        assignedAgentId: agents[2].agentId,
      },
      {
        priority: "medium",
        category: "account",
        subject: "Update email address",
        description: "I need to change my account email from old@example.com to new@example.com",
        customerId: "CUST-006",
        tags: ["account-update"],
        status: "resolved",
        assignedAgentId: agents[1].agentId,
        resolution: {
          text: "Email address has been successfully updated. You should receive a confirmation email at your new address.",
          resolvedBy: agents[1].agentId,
          resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
      },
      {
        priority: "critical",
        category: "billing",
        subject: "Fraudulent charges",
        description: "I see multiple unauthorized charges on my account totaling $500. I did not make these purchases.",
        customerId: "CUST-007",
        tags: ["fraud", "urgent", "security"],
        status: "escalated",
        assignedAgentId: agents[0].agentId,
      },
      {
        priority: "low",
        category: "other",
        subject: "Question about product features",
        description: "Does the premium plan include API access? I couldn't find this information on the website.",
        customerId: "CUST-008",
        tags: ["question", "features"],
        status: "open",
      },
      {
        priority: "medium",
        category: "shipping",
        subject: "Wrong item received",
        description: "I ordered a blue widget but received a red one. Order #54321.",
        customerId: "CUST-009",
        tags: ["wrong-item", "exchange"],
        status: "pending",
        assignedAgentId: agents[3].agentId,
      },
      {
        priority: "high",
        category: "account",
        subject: "Data export request",
        description: "Per GDPR, I'm requesting a full export of all my personal data stored in your system.",
        customerId: "CUST-010",
        tags: ["gdpr", "data-export", "privacy"],
        status: "open",
      },
      {
        priority: "low",
        category: "returns",
        subject: "Return status inquiry",
        description: "I sent back an item 2 weeks ago. When will I receive my refund?",
        customerId: "CUST-011",
        tags: ["return-status"],
        status: "resolved",
        assignedAgentId: agents[2].agentId,
        resolution: {
          text: "Your return was processed on [date]. Refund of $79.99 has been issued and should appear in 3-5 business days.",
          resolvedBy: agents[2].agentId,
          resolvedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        },
      },
      {
        priority: "medium",
        category: "billing",
        subject: "Payment method update failed",
        description: "I'm trying to update my credit card but keep getting an error message.",
        customerId: "CUST-012",
        tags: ["payment", "technical-issue"],
        status: "open",
      },
      {
        priority: "high",
        category: "shipping",
        subject: "Damaged item received",
        description: "The package arrived damaged and the item inside is broken. Order #99999.",
        customerId: "CUST-013",
        tags: ["damaged", "replacement"],
        status: "pending",
        assignedAgentId: agents[1].agentId,
      },
      {
        priority: "low",
        category: "other",
        subject: "Newsletter unsubscribe",
        description: "I've clicked unsubscribe multiple times but still receiving marketing emails.",
        customerId: "CUST-014",
        tags: ["unsubscribe", "marketing"],
        status: "open",
      },
      {
        priority: "critical",
        category: "account",
        subject: "Account hacked",
        description: "Someone has accessed my account and changed my password. I can't log in anymore!",
        customerId: "CUST-015",
        tags: ["security", "urgent", "hacked"],
        status: "escalated",
        assignedAgentId: agents[0].agentId,
      },
    ];

    const tickets = [];
    for (const data of ticketData) {
      const ticket = new TicketModel({
        ...data,
        auditLog: [
          {
            actor: "system",
            action: "created",
            diff: { status: data.status },
            timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
          },
        ],
      });
      await ticket.save();
      tickets.push(ticket);
    }

    logger.info({ count: tickets.length }, "Created tickets");

    // Update agent active ticket counts
    for (const agent of agents) {
      const activeCount = await TicketModel.countDocuments({
        assignedAgentId: agent.agentId,
        status: { $in: ["open", "pending", "escalated"] },
      });
      agent.activeTickets = activeCount;
      await agent.save();
    }

    logger.info("Updated agent active ticket counts");

    logger.info("✅ Database seeded successfully!");
    logger.info(`
      Agents created: ${agents.length}
      Tickets created: ${tickets.length}
      
      Login credentials (all agents):
      Email: alice@example.com, bob@example.com, carol@example.com, david@example.com
      Password: password123
    `);

    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    logger.error({ error }, "Seed failed");
    process.exit(1);
  }
}

seed();

// Made with Bob
