# Etapa 1: instalar solo las dependencias de produccion
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Etapa 2: imagen final de ejecucion
FROM node:22-alpine
WORKDIR /app

# SHA del commit, se muestra en /health para identificar la version desplegada
ARG GIT_SHA=local
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    GIT_SHA=${GIT_SHA}

COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src

# Ejecutar sin privilegios de root
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

# La configuracion de RDS (DB_HOST, DB_USER, DB_PASSWORD, ...) llega por variables
# de entorno al ejecutar el contenedor; no se incluye en la imagen.
CMD ["node", "src/server.js"]
