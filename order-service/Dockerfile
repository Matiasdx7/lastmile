FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY order-service/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY order-service ./
COPY shared ../shared

# Build TypeScript code
RUN npm run build

# Expose service port
EXPOSE 3001

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Start the service
CMD ["node", "dist/index.js"]