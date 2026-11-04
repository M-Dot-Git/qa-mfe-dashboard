#===============================================================================
# BUILD STAGE
#===============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:8000
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ARG VITE_TEST_REPORTS_REMOTE_URL=http://localhost:3005/assets/remoteEntry.js
ENV VITE_TEST_REPORTS_REMOTE_URL=$VITE_TEST_REPORTS_REMOTE_URL

RUN npm run build

#===============================================================================
# SERVE STAGE
#===============================================================================
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]