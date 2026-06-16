import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import cors from 'cors';
import { typeDefs } from './schema/typeDefs';
import { resolvers } from './resolvers';
import { TicketServiceClient } from './services/ticketService';
import { AIServiceClient } from './services/aiService';
import { createAuthContext } from './middleware/auth';
import { createDataLoaders } from './dataloaders/agentLoader';
import { logger } from './utils/logger';
import { register, websocketConnections } from './utils/metrics';
import {
  graphqlOperationDuration,
  graphqlOperationErrors,
  graphqlOperationCount,
} from './utils/metrics';

const PORT = process.env.PORT || 4000;
const TICKET_SERVICE_URL = process.env.TICKET_SERVICE_URL || 'http://localhost:3001';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:3002';

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Initialize service clients
  const ticketService = new TicketServiceClient(TICKET_SERVICE_URL);
  const aiService = new AIServiceClient(AI_SERVICE_URL);

  // Create executable schema
  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // Create WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  // Track WebSocket connections
  let activeConnections = 0;

  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        // Track connection lifecycle
        if (ctx.connectionParams) {
          activeConnections++;
          websocketConnections.set(activeConnections);
          logger.info({ activeConnections }, 'WebSocket connection opened');
        }

        return {
          ticketService,
          aiService,
          auth: { user: null, isAuthenticated: false }, // WebSocket auth would go here
          dataloaders: createDataLoaders(ticketService),
        };
      },
      onDisconnect: () => {
        activeConnections--;
        websocketConnections.set(activeConnections);
        logger.info({ activeConnections }, 'WebSocket connection closed');
      },
    },
    wsServer
  );

  // Create Apollo Server
  const server = new ApolloServer({
    schema,
    context: ({ req }: any) => {
      const auth = createAuthContext(req);
      return {
        ticketService,
        aiService,
        auth,
        dataloaders: createDataLoaders(ticketService),
      };
    },
    plugins: [
      // Proper shutdown for WebSocket server
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
      // Metrics plugin
      {
        async requestDidStart() {
          const start = Date.now();
          let operationName = 'unknown';
          let operationType = 'unknown';

          return {
            async didResolveOperation(requestContext: any) {
              operationName = requestContext.operationName || 'anonymous';
              operationType = requestContext.operation?.operation || 'unknown';
            },
            async willSendResponse() {
              const duration = (Date.now() - start) / 1000;
              graphqlOperationDuration
                .labels(operationName, operationType)
                .observe(duration);
              graphqlOperationCount.labels(operationName, operationType).inc();
            },
            async didEncounterErrors(requestContext: any) {
              const errors = requestContext.errors || [];
              errors.forEach((error: any) => {
                const errorType = error.extensions?.code || 'UNKNOWN';
                graphqlOperationErrors
                  .labels(operationName, operationType, errorType as string)
                  .inc();
              });
            },
          };
        },
      },
    ],
    formatError: (error: any) => {
      logger.error({ error: error.message, stack: error.stack }, 'GraphQL error');
      return error;
    },
  });

  await server.start();
  server.applyMiddleware({ app: app as any, path: '/graphql' });

  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      const [ticketHealth, aiHealth] = await Promise.allSettled([
        ticketService.healthCheck(),
        aiService.healthCheck(),
      ]);

      const isHealthy =
        ticketHealth.status === 'fulfilled' && ticketHealth.value.status === 'ok';

      res.status(isHealthy ? 200 : 503).json({
        status: isHealthy ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          ticketService: ticketHealth.status === 'fulfilled' && ticketHealth.value.status === 'ok',
          aiService: aiHealth.status === 'fulfilled' && aiHealth.value.status === 'ok',
          database:
            ticketHealth.status === 'fulfilled' && ticketHealth.value.database,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Health check failed');
      res.status(503).json({
        status: 'error',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Metrics endpoint
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  // Start server
  httpServer.listen(PORT, () => {
    logger.info(
      {
        port: PORT,
        graphqlPath: server.graphqlPath,
        ticketServiceUrl: TICKET_SERVICE_URL,
        aiServiceUrl: AI_SERVICE_URL,
      },
      'API Gateway started'
    );
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`🔌 Subscriptions ready at ws://localhost:${PORT}${server.graphqlPath}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await server.stop();
    httpServer.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

startServer().catch((error) => {
  logger.error({ error }, 'Failed to start server');
  process.exit(1);
});

