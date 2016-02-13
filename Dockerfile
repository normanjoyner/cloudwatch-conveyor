FROM library/node:5.6.0

MAINTAINER ContainerShip Developers <developers@containership.io>

RUN mkdir /app
ADD . /app
WORKDIR /app
RUN npm install
CMD node application
