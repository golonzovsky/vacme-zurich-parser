FROM node:16-alpine as build

WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

COPY package.json yarn.lock ./
COPY src ./src
COPY public ./public

RUN yarn
RUN yarn build

FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]