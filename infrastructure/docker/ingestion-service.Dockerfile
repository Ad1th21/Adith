# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY shared/package.json ./shared/
COPY backend/ingestion-service/package.json ./backend/ingestion-service/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY shared ./shared
COPY backend/ingestion-service ./backend/ingestion-service
COPY tsconfig.json ./

# Build
RUN pnpm --filter @telemetry/shared build
RUN pnpm --filter ingestion-service build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY backend/ingestion-service/package.json ./backend/ingestion-service/

# Install pnpm
RUN npm install -g pnpm

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy built files
COPY --from=builder /app/backend/ingestion-service/dist ./backend/ingestion-service/dist
COPY --from=builder /app/shared/dist ./shared/dist

# Set environment
ENV NODE_ENV=production

# Expose port
EXPOSE 3000

# Start service
CMD ["node", "backend/ingestion-service/dist/index.js"]
