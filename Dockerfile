# Dockerfile
# Базовый образ для сборки
FROM node:20-alpine AS build

RUN apk add --no-cache python3 make g++

# Рабочая директория
WORKDIR /app

# Копируем package.json и package-lock.json в корневую директорию
COPY package*.json ./
COPY lerna.json ./

COPY packages/client/package*.json ./packages/client/
COPY packages/common/package*.json ./packages/common/
COPY packages/backend/package*.json ./packages/backend/
COPY packages/server/package*.json ./packages/server/

# Устанавливаем зависимости в корневой директории
RUN npm install

# Копируем остальные файлы проекта
COPY . .

# Выполняем сборку всех пакетов
RUN npm run build:hosted


# Образ для client
FROM nginx:alpine AS client

# Копируем собранные файлы из предыдущего этапа
COPY --from=build /app/packages/client/build /usr/share/nginx/html

# Копируем конфигурационный файл Nginx
COPY packages/client/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт
EXPOSE 3000

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"]

# Образ для server
FROM node:20-alpine AS server

# Рабочая директория
WORKDIR /app

# Копируем файлы из предыдущего этапа
COPY --from=build /app /app

# Запускаем миграции Prisma
RUN npx prisma migrate deploy --schema /app/packages/common/prisma/schema.prisma

# Открываем порт
EXPOSE 8080

# Запускаем сервер
CMD ["npm", "run", "start:server"]
