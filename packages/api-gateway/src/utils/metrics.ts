import { register, Counter, Histogram, Gauge } from 'prom-client';

// GraphQL operation metrics
export const graphqlOperationDuration = new Histogram({
  name: 'graphql_operation_duration_seconds',
  help: 'Duration of GraphQL operations in seconds',
  labelNames: ['operation_name', 'operation_type'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
});

export const graphqlOperationErrors = new Counter({
  name: 'graphql_operation_errors_total',
  help: 'Total number of GraphQL operation errors',
  labelNames: ['operation_name', 'operation_type', 'error_type'],
});

export const graphqlOperationCount = new Counter({
  name: 'graphql_operation_count_total',
  help: 'Total number of GraphQL operations',
  labelNames: ['operation_name', 'operation_type'],
});

// Backend service metrics
export const backendServiceRequests = new Counter({
  name: 'backend_service_requests_total',
  help: 'Total number of backend service requests',
  labelNames: ['service', 'method', 'status'],
});

export const backendServiceDuration = new Histogram({
  name: 'backend_service_duration_seconds',
  help: 'Duration of backend service requests in seconds',
  labelNames: ['service', 'method'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
});

// WebSocket metrics
export const websocketConnections = new Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
});

export const websocketMessages = new Counter({
  name: 'websocket_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['type'],
});

// DataLoader metrics
export const dataloaderBatchSize = new Histogram({
  name: 'dataloader_batch_size',
  help: 'Size of DataLoader batches',
  labelNames: ['loader_name'],
  buckets: [1, 2, 5, 10, 20, 50, 100],
});

export const dataloaderCacheHits = new Counter({
  name: 'dataloader_cache_hits_total',
  help: 'Total number of DataLoader cache hits',
  labelNames: ['loader_name'],
});

export const dataloaderCacheMisses = new Counter({
  name: 'dataloader_cache_misses_total',
  help: 'Total number of DataLoader cache misses',
  labelNames: ['loader_name'],
});

// Export the registry for /metrics endpoint
export { register };

// Made with Bob
