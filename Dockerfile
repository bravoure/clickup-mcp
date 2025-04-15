FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Set environment variables
ENV NODE_ENV=production

# Run the server
CMD ["node", "src/index.js"]
