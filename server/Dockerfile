# FILE: server/Dockerfile

# --- Build Stage ---
# Start with a full Node.js image to ensure we have all build tools
FROM node:18.18-alpine AS builder

# Set the working directory
WORKDIR /usr/src/app

# Copy package files and install ALL dependencies (including dev)
COPY package*.json ./
RUN npm install

# Copy the rest of the source code
COPY . .

# Generate the Prisma client and run the TypeScript build
RUN npm run postinstall
RUN npm run build

# --- Production Stage ---
# Start from a clean, lean image for the final product
FROM node:18.18-alpine

WORKDIR /usr/src/app

# Copy only the necessary package files
COPY package*.json ./

# Install only the production dependencies
RUN npm install --production

# Copy the built application from the 'builder' stage
COPY --from=builder /usr/src/app/dist ./dist
# Copy the Prisma schema for the runtime
COPY --from=builder /usr/src/app/prisma ./prisma

# Expose the application port
EXPOSE 3001

# The command to start the application
CMD ["node", "dist/server.js"]