FROM mhart/alpine-node:13

ARG HOST_USER_ID=1000
ARG HOST_GROUP_ID=1000

ENV \
  HOST_USER_ID=$HOST_USER_ID \
  HOST_GROUP_ID=$HOST_GROUP_ID

RUN \
  if [ $(getent group ${HOST_GROUP_ID}) ]; then \
    adduser -D -u ${HOST_USER_ID} hex; \
  else \
    addgroup -g ${HOST_GROUP_ID} hex && \
    adduser -D -u ${HOST_USER_ID} -G hex hex; \
  fi

WORKDIR /usr/src/app

COPY . .

RUN \
  apk --no-cache add \
    gettext && \
  yarn --production && \
  chown -R hex:hex /usr/src/app && \
  mkdir /data && chown -R hex:hex /data

COPY docker-entrypoint.sh /usr/local/bin/start
RUN chmod +x /usr/local/bin/start

USER hex

ENTRYPOINT ["/usr/local/bin/start"]
