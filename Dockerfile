FROM mhart/alpine-node:13

WORKDIR /usr/src/app

COPY . .

RUN \
  apk --no-cache add \
    gettext \
    su-exec && \
  yarn --production && \
  mkdir /data

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint
COPY docker-cmd-start.sh /usr/local/bin/start
RUN \
  chmod +x /usr/local/bin/docker-entrypoint && \
  chmod +x /usr/local/bin/start

ENTRYPOINT ["docker-entrypoint"]
CMD ["start"]
