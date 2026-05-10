# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Runtime stage - copia o build para o volume compartilhado
FROM alpine:latest

WORKDIR /output

COPY --from=builder /app/dist .

CMD ["sh", "-c", "cp -r /output/* /app/dist/ && sleep infinity"]