# --- Etapa 1: Construcción (Builder) ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copiamos los archivos de dependencias e instalamos
COPY package*.json ./
RUN npm install

# Copiamos el resto del código y construimos la aplicación
COPY . .
RUN npm run build

# --- Etapa 2: Servidor Web (Nginx) ---
FROM nginx:alpine

# Copiamos los archivos estáticos generados por Vite (carpeta 'dist') a Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Inyectamos una configuración de Nginx para que funcione el enrutamiento interno de React (React Router) y evite errores 404 al recargar
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Exponemos el puerto 80
EXPOSE 80

# Iniciamos Nginx
CMD ["nginx", "-g", "daemon off;"]