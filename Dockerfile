FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Build application
RUN npm run build

# Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built dist and public files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Expose server port
EXPOSE 4321

# Run standalone Astro Node SSR entry point
CMD ["node", "./dist/server/entry.mjs"]
