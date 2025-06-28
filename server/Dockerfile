# FILE: server/Dockerfile

# Start with a stable and lightweight Node.js image
FROM node:18.18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies to keep the image small
RUN npm install --production

# Copy the rest of the application source code
COPY . .

# Run the TypeScript build process
RUN npm run build

# Expose the port the application will run on
EXPOSE 3001

# The command to start the application directly with Node
CMD ["node", "dist/server.js"]