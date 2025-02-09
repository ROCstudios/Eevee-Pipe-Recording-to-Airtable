# Use Node.js base image
FROM node:18

# Install FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create uploads directory if needed
RUN mkdir -p uploads

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "js/server.js"]
