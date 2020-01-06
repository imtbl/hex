#!/bin/sh

stop() {
  pkill node
  sleep 1
}

trap "stop" SIGTERM

envsubst < .env.docker > .env

yarn start &
wait $!
