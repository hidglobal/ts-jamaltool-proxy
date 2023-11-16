FROM alpine:3.18.4
EXPOSE 4000
RUN apk add nodejs-current npm
ADD ./ /home/node/app
WORKDIR /home/node/app
RUN npm install && pwd && ls -l
ENTRYPOINT ["node","index.js"]
