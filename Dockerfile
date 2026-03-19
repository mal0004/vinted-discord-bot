FROM node:20-alpine

RUN mkdir -p /home/app

COPY ./app /home/app

WORKDIR /home/app

RUN yarn install --frozen-lockfile

RUN yarn build

CMD [ "yarn", "start" ]
