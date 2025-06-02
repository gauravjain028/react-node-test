# Use the official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy rest of the app files
COPY . .

# List files to verify copy
RUN ls -la

# Expose the app port (change if your app uses another port)
EXPOSE 5001

# Keep container running
CMD ["tail", "-f", "/dev/null"]
