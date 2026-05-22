FROM oven/bun:1-alpine

WORKDIR /app

RUN apk add --no-cache curl

COPY package.json ./
RUN bun install

COPY . .
RUN bun x prisma generate

EXPOSE 4001

CMD ["bun", "run", "src/main.ts"]
