FROM node:lts-slim AS build
LABEL maintainer="mjyoder@psc.edu"
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM scratch
LABEL maintainer="mjyoder@psc.edu"
LABEL org.opencontainers.image.source="https://github.com/pscedu/cpra-mp-ui"
COPY --from=build /usr/src/app/dist /
