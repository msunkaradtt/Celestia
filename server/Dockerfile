# FILE: server/Dockerfile

# ---- STAGE 1: The Builder ----
# This stage installs all dependencies and builds the project.
FROM node:18 AS builder
WORKDIR /app

# Copy package files and schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies. This will also trigger "npm run postinstall"
# which runs "prisma generate" for the builder environment.
RUN npm install

# Copy the rest of the source code
COPY . .

# Compile TypeScript into JavaScript
RUN npm run build


# ---- STAGE 2: The Production Image ----
# This stage creates the final, lean container for running the app.
FROM node:18-alpine
WORKDIR /app

# Install netcat for our wait script and openssl for Prisma
RUN apk add --no-cache netcat-openbsd openssl

# Copy package files and schema
COPY package*.json ./
COPY prisma ./prisma/

# Install ONLY production dependencies. This triggers the postinstall script again.
RUN npm install --omit=dev

# Copy the compiled 'dist' folder from the 'builder' stage
COPY --from=builder /app/dist ./dist

# Copy the wait script and make it executable
COPY wait-for-it.sh .
RUN chmod +x ./wait-for-it.sh

# --- THE FINAL, SIMPLIFIED COMMAND ---
# This command simply runs our new script. The script itself handles everything else.
CMD ["/app/wait-for-it.sh"]