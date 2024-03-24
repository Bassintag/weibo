FROM oven/bun:1

WORKDIR /home/app

COPY ./package.json .
COPY ./bun.lockb .
RUN bun install --production --frozen-lockfile

COPY ./tsconfig.json .
COPY ./src ./src

USER bun

CMD ["bun", "run", "start", "monitor"]