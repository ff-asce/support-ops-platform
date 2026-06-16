# Multi-stage build for ai-resolution-service
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY turbo.json ./

# Copy workspace packages
COPY packages/shared ./packages/shared
COPY packages/ai-resolution-service ./packages/ai-resolution-service

# Install dependencies
RUN npm ci

# Build shared package first
RUN npm run build --workspace=@support-ops/shared

# Build ai-resolution-service
RUN npm run build --workspace=@support-ops/ai-resolution-service

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy built artifacts
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/ai-resolution-service/dist ./packages/ai-resolution-service/dist
COPY --from=builder /app/packages/ai-resolution-service/package.json ./packages/ai-resolution-service/

# Install production dependencies only
RUN npm ci --omit=dev --workspace=@support-ops/ai-resolution-service

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3002

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the service
CMD ["node", "packages/ai-resolution-service/dist/index.js"]

# Made with Bob
