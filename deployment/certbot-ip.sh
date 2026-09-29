#!/bin/sh
set -eu
case "${1:-}" in
  issue)
    shift
    exec certbot certonly --non-interactive --agree-tos --email "$JUHE_TLS_EMAIL" \
      --preferred-profile shortlived --webroot --webroot-path /var/www/acme \
      --ip-address "$JUHE_PUBLIC_IP" --cert-name juhe-ip --keep-until-expiring "$@"
    ;;
  renew)
    shift
    exec certbot renew --cert-name juhe-ip --non-interactive --no-random-sleep-on-renew "$@"
    ;;
  *) echo 'Usage: certbot-ip.sh issue|renew [certbot options]' >&2; exit 2 ;;
esac
