FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./backend/
RUN npm --prefix backend ci

COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN npm --prefix frontend ci
COPY frontend ./frontend
RUN npm --prefix frontend run build

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV DATABASE_FILE=/data/finance.db
WORKDIR /app

COPY backend/package.json backend/package-lock.json ./backend/
RUN npm --prefix backend ci --omit=dev
COPY backend/src ./backend/src
COPY --from=build /app/frontend/dist ./frontend/dist

EXPOSE 4000
CMD ["node", "backend/src/server.js"]
