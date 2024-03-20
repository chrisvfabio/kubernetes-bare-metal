# Use the official Node.js 14 image as the base image
FROM node:21-alpine3.18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Start the Node.js application
CMD ["node", "app.js"]