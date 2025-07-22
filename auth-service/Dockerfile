FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY auth-service/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY auth-service ./
COPY shared ../shared

# Build TypeScript code
RUN npm run build

# Expose service port
EXPOSE 3007

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3007

# Start the service
CMD ["node", "dist/index.js"]