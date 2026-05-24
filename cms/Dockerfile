FROM node:22-bookworm-slim AS build

WORKDIR /app

ENV NODE_ENV=development

COPY package.json package.json
RUN npm install

COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app /app

EXPOSE 1337

CMD ["npm", "run", "start"]
