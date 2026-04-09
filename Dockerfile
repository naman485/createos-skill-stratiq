FROM node:20-slim

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files AND prisma schema (needed for postinstall)
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install dependencies (postinstall runs prisma generate which needs the schema)
RUN npm ci

# Copy the rest of the source
COPY . .

# Build Next.js
RUN npx prisma generate && npm run build

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Start: push DB schema then run Next.js
CMD ["sh", "-c", "npx prisma db push --skip-generate && node_modules/.bin/next start -p ${PORT:-3000}"]
