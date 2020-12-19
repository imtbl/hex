FROM mhart/alpine-node:15

ARG USER_ID=1000
ARG GROUP_ID=1000

ENV \
  USER_ID=$USER_ID \
  GROUP_ID=$GROUP_ID

WORKDIR /usr/src/app

COPY . .

RUN \
  apk --no-cache add \
    gettext && \
  yarn --production && \
  chown -R ${USER_ID}:${GROUP_ID} /usr/src/app && \
  mkdir /data && chown -R ${USER_ID}:${GROUP_ID} /data

COPY docker-cmd-start.sh /usr/local/bin/start
RUN chmod +x /usr/local/bin/start

USER ${USER_ID}:${GROUP_ID}

CMD ["start"]
