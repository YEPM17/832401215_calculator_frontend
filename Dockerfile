FROM node:24-alpine

WORKDIR /app

COPY server.mjs index.html ./
COPY css ./css
COPY js ./js

ENV HOST=0.0.0.0
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server.mjs"]
