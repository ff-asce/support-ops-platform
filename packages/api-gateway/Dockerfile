# Multi-stage build for api-gateway
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace packages
COPY packages/shared ./packages/shared
COPY packages/api-gateway ./packages/api-gateway

# Install dependencies
RUN npm ci

# Build shared package first
RUN npm run build --workspace=@support-ops/shared

# Build api-gateway
RUN npm run build --workspace=@support-ops/api-gateway

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy built artifacts
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/api-gateway/dist ./packages/api-gateway/dist
COPY --from=builder /app/packages/api-gateway/package.json ./packages/api-gateway/

# Install production dependencies only
RUN npm ci --omit=dev --workspace=@support-ops/api-gateway

# Set environment variables
ENV NODE_ENV=production
ENV PORT=4000

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the service
CMD ["node", "packages/api-gateway/dist/index.js"]

# Made with Bob
