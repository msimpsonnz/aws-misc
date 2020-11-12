FROM alpine:latest

RUN apk update && apk add --virtual --no-cache \
  openssh

COPY sshd_config /etc/ssh/sshd_config

RUN mkdir -p /root/.ssh/
COPY authorized-keys/public.pub /root/.ssh/
RUN cat /root/.ssh/*.pub > /root/.ssh/authorized_keys
RUN chown -R root:root /root/.ssh && chmod -R 600 /root/.ssh

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
RUN ln -s /usr/local/bin/docker-entrypoint.sh /

# We have to set a password to be let in for root - MAKE THIS STRONG.
RUN echo 'root:THEPASSWORDYOUCREATED' | chpasswd

EXPOSE 22
ENTRYPOINT ["docker-entrypoint.sh"]