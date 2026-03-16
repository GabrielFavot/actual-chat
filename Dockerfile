FROM node:20-alpine

WORKDIR /app

# Install build tools needed for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies and source code to reduce image size
RUN npm ci --only=production && rm -rf src

# Switch to non-root user
USER node

# Start the bot
CMD ["npm", "start"]
