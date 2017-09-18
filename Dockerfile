FROM node

WORKDIR /app

COPY ./package.json /app/package.json
COPY ./yarn.lock /app/yarn.lock

RUN yarn --ignore-scripts

COPY . /app

RUN yarn run build

ENTRYPOINT npm start
