#!/bin/sh

if [ "$SSH_ENABLED" = true ]; then
  if [ ! -f "/etc/ssh/ssh_host_rsa_key" ]; then
    # generate fresh rsa key
    ssh-keygen -f /etc/ssh/ssh_host_rsa_key -N '' -t rsa
  fi
  if [ ! -f "/etc/ssh/ssh_host_dsa_key" ]; then
    # generate fresh dsa key
    ssh-keygen -f /etc/ssh/ssh_host_dsa_key -N '' -t dsa
  fi

  #prepare run dir
  if [ ! -d "/var/run/sshd" ]; then
    mkdir -p /var/run/sshd
  fi

  /usr/sbin/sshd

  env | grep '_\|PATH' | awk '{print "export " $0}' >> /root/.profile
fi

exec "$@"
