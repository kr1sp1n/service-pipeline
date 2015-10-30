FROM mhart/alpine-node:base

WORKDIR /src
ADD . .

EXPOSE 4000
CMD ["node", "server.js"]
