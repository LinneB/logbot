FROM node:lts-hydrogen
WORKDIR /usr/src/app
COPY ["package*.json", "./"]
RUN npm install --production --silent && mv node_modules ../
COPY . .
RUN chown -R node /usr/src/app
USER node
CMD ["node", "index.js"]
