FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Set correct permissions
RUN chown -R node:node /app

# Use node user instead of root
USER node

EXPOSE 3000 

# Keep container running
CMD ["tail", "-f", "/dev/null"]
