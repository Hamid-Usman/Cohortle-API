# -------- BUILD STAGE --------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

# -------- RUNTIME STAGE --------
FROM node:20-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -S nodegroup && adduser -S nodeuser -G nodegroup

COPY --from=builder /app /app

# Copy entrypoint + make executable INSIDE the image
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nodeuser

EXPOSE 3000
ENTRYPOINT ["docker-entrypoint.sh"]
