FROM node:20-slim

WORKDIR /app

COPY package*.json ./

# Install dependencies and keep build tools until after copying files and building
RUN apt-get update && \
    apt-get install -y python3 make g++ && \
    npm install

COPY . .

# Now rebuild bcrypt after all files are copied
RUN npm rebuild bcrypt --build-from-source && \
    # Clean up after everything is built properly
    apt-get purge -y python3 make g++ && \
    apt-get autoremove -y && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

EXPOSE 3001

CMD ["node", "src/index.js"]