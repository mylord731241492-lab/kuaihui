#!/usr/bin/env bash
# Run on the target Linux host with Docker Compose v2 installed.
set -Eeuo pipefail
umask 077
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
cd -- "$ROOT"
NODE_IMAGE=${JUHE_NODE_IMAGE:-public.ecr.aws/docker/library/node:24-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6}
COMPOSE=(docker compose --project-directory "$ROOT" --env-file "$ROOT/.env.ip" -f "$ROOT/compose.ip.yaml")
die() { echo "$*" >&2; exit 1; }
require_config() {
  [[ -f .env.ip ]] || die 'Run: sudo bash ip-deploy.sh init PUBLIC_IPV4 EMAIL'
  "${COMPOSE[@]}" config --quiet
}
reload_caddy() {
  "${COMPOSE[@]}" exec -T caddy caddy reload --config /etc/juhe/Caddyfile.active --adapter caddyfile --force
}
status() { "${COMPOSE[@]}" run --rm --no-deps tls-status; }
install_timer() {
  [[ $EUID -eq 0 ]] || die 'Timer installation requires sudo.'
  command -v systemctl >/dev/null || die 'A systemd Linux host is required for automatic renewal.'
  # Keep the generated unit unambiguous; instructions use /opt/juhe/deployment.
  [[ $ROOT =~ ^/[A-Za-z0-9_./-]+$ ]] || die 'Move the package to a simple path such as /opt/juhe (no spaces).'
  local unit=/etc/systemd/system/juhe-ip-renew.service
  if [[ -e $unit ]] && ! grep -Fqx "# Managed by $ROOT/ip-deploy.sh" "$unit"; then
    die 'An existing juhe-ip-renew service belongs to another path. Review it before switching installations.'
  fi
  cat > "$unit" <<EOF
# Managed by $ROOT/ip-deploy.sh
[Unit]
Description=Juhe IP certificate renewal and live TLS verification
Wants=network-online.target docker.service
After=network-online.target docker.service
[Service]
Type=oneshot
ExecStart=/bin/bash $ROOT/ip-deploy.sh renew
TimeoutStartSec=30min
EOF
  cat > /etc/systemd/system/juhe-ip-renew.timer <<'EOF'
[Unit]
Description=Check Juhe IP certificate every six hours
[Timer]
OnCalendar=*-*-* 00,06,12,18:00:00
RandomizedDelaySec=15min
Persistent=true
Unit=juhe-ip-renew.service
[Install]
WantedBy=timers.target
EOF
  chmod 644 "$unit" /etc/systemd/system/juhe-ip-renew.timer
  systemctl daemon-reload
  systemctl enable --now juhe-ip-renew.timer
  systemctl is-enabled --quiet juhe-ip-renew.timer
  systemctl is-active --quiet juhe-ip-renew.timer
}
command -v docker >/dev/null || die 'Install Docker Engine and the Compose plugin first.'
command -v flock >/dev/null || die 'Install util-linux (flock) first.'
exec 9> "$ROOT/.ip-deploy.lock"
flock -n 9 || die 'Another IP deployment or certificate check is running; retry later.'
case "${1:-}" in
  init)
    [[ $# -eq 3 ]] || die 'Usage: sudo bash ip-deploy.sh init PUBLIC_IPV4 EMAIL'
    docker run --rm --user 0 -v "$ROOT:/setup" -w /setup "$NODE_IMAGE" node initialize.mjs --ip "$2" --email "$3"
    ;;
  up)
    require_config
    [[ $EUID -eq 0 ]] || die 'Run up with sudo so automatic renewal can be installed.'
    command -v systemctl >/dev/null || die 'This entry point requires a systemd Linux host.'
    [[ $ROOT =~ ^/[A-Za-z0-9_./-]+$ ]] || die 'Use a path such as /opt/juhe (no spaces).'
    mkdir -p state/ip-caddy
    if [[ ! -f state/ip-caddy/Caddyfile.active ]]; then
      cp Caddyfile.ip-bootstrap state/ip-caddy/Caddyfile.active
    fi
    "${COMPOSE[@]}" up -d --no-deps caddy
    # Staging validation never installs an untrusted certificate.
    "${COMPOSE[@]}" run --rm --no-deps certbot issue --dry-run
    "${COMPOSE[@]}" run --rm --no-deps certbot issue
    "${COMPOSE[@]}" up -d --build auth maintenance
    cp Caddyfile.ip state/ip-caddy/Caddyfile.pending
    "${COMPOSE[@]}" exec -T caddy caddy validate --config /etc/juhe/Caddyfile.pending --adapter caddyfile
    cp state/ip-caddy/Caddyfile.active state/ip-caddy/Caddyfile.previous
    mv -f state/ip-caddy/Caddyfile.pending state/ip-caddy/Caddyfile.active
    if ! reload_caddy; then
      cp state/ip-caddy/Caddyfile.previous state/ip-caddy/Caddyfile.active
      die 'Caddy reload failed; previous configuration restored on disk. Inspect container logs.'
    fi
    status
    install_timer
    echo 'HTTPS is ready and renewal timer is active. Initialize the administrator using the deployment guide.'
    ;;
  renew)
    require_config
    "${COMPOSE[@]}" run --rm --no-deps certbot renew
    # Force reread even when config text is unchanged; retry after previous reload failures.
    reload_caddy
    status
    ;;
  check)
    require_config
    "${COMPOSE[@]}" run --rm --no-deps certbot renew --dry-run
    status
    ;;
  status)
    require_config
    "${COMPOSE[@]}" ps
    status
    ;;
  install-timer)
    require_config
    install_timer
    ;;
  *) die 'Usage: sudo bash ip-deploy.sh init PUBLIC_IPV4 EMAIL | up | renew | check | status | install-timer' ;;
esac
