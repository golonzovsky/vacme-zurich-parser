FROM node:16-alpine as build

WORKDIR /app

COPY . ./
RUN yarn

COPY src ./src
EXPOSE 3000
CMD yarn start