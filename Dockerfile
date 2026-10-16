FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application code
COPY . .

# Build application
RUN npm run build

# Prune devDependencies to keep only production dependencies
RUN npm prune --production

# Production image
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# Copy package files and built artifacts
COPY package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Ensure upload directories can be created
RUN mkdir -p /app/uploads/catalogo /app/uploads/rma

# Expose server port
EXPOSE 4321

# Run standalone Astro Node SSR entry point
CMD ["node", "./dist/server/entry.mjs"]
