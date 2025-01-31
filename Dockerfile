# Базовый образ для сборки
FROM node:22.7-alpine AS build

RUN apk add --no-cache python3 make g++

# Рабочая директория
WORKDIR /usr/src/app

# Копируем package.json и package-lock.json в корневую директорию
COPY lerna.json ./
COPY package*.json ./
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
COPY --from=build /usr/src/app/packages/client/build /usr/share/nginx/html

# Копируем apple-app-site-association в директорию .well-known
COPY --from=build /usr/src/app/packages/client/build/.well-known/apple-app-site-association /usr/share/nginx/html/.well-known/apple-app-site-association

# Копируем конфигурационный файл Nginx
COPY packages/client/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Запускаем Nginx
CMD ["nginx", "-g", "daemon off;"]

# Образ для server
FROM node:22.7-alpine AS server

# Рабочая директория
WORKDIR /usr/src/app

# Копируем файлы из предыдущего этапа
COPY --from=build /usr/src/app /usr/src/app

# Выполнение миграций Prisma
RUN npx prisma migrate deploy

# Открываем порт
EXPOSE 8080

# Запускаем сервер
CMD ["sh", "-c", "npm run start:server"]
