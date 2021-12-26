FROM node

RUN mkdir -p /home/app

COPY ./app /home/app

WORKDIR /home/app

RUN yarn install

RUN yarn build

CMD ['node', 'dist/index.js']
