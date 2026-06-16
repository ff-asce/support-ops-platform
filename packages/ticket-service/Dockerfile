# Multi-stage build for ticket-service
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace packages
COPY packages/shared ./packages/shared
COPY packages/ticket-service ./packages/ticket-service

# Install dependencies
RUN npm ci

# Build shared package first
RUN npm run build --workspace=@support-ops/shared

# Build ticket-service
RUN npm run build --workspace=@support-ops/ticket-service

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy built artifacts
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/ticket-service/dist ./packages/ticket-service/dist
COPY --from=builder /app/packages/ticket-service/package.json ./packages/ticket-service/

# Install production dependencies only
RUN npm ci --omit=dev --workspace=@support-ops/ticket-service

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the service
CMD ["node", "packages/ticket-service/dist/index.js"]

# Made with Bob
