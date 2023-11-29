FROM node:20-alpine as builder

WORKDIR /home/app

COPY package.json .
COPY yarn.lock .

RUN yarn

COPY tsconfig.json .
COPY src ./src

RUN yarn build

FROM node:20-alpine as production

WORKDIR /home/app

COPY package.json .
COPY yarn.lock .

RUN yarn --production

COPY --from=builder /home/app/dist .

CMD ["node", ".", "monitor"]