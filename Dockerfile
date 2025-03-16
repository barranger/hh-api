FROM node:18

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Expose port
EXPOSE 3000

# Add npm start script to package.json
RUN npm pkg set scripts.start="node index.js"

# Start the app
CMD ["npm", "start"] 