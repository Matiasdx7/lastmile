FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY api-gateway/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY api-gateway ./

# Expose service port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start the service
CMD ["node", "src/index.js"]