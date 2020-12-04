FROM node:12

WORKDIR /usr/src/server

RUN apt-get update

COPY package*.json ./

RUN npm install

COPY . .

CMD [ "npm", "run", "start" ]