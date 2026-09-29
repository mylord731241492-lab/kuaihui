import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import tls from 'node:tls';
import { randomBytes, X509Certificate } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const MINIMUM_VALIDITY_MS = 48 * 60 * 60 * 1000;
export const CONNECTION_TIMEOUT_MS = 10_000;

function failure(code, message) {
  return Object.assign(new Error(message), { code });
}

function asCertificate(value) {
  return value instanceof X509Certificate ? value : new X509Certificate(value);
}

export function validatePublicIpv4(ip) {
  if (net.isIP(ip) !== 4) throw failure('INVALID_IP', 'Expected a public IPv4 address.');
  const [a, b, c] = ip.split('.').map(Number);
  if (a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
      (a === 192 && b === 0 && (c === 0 || c === 2)) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113)) {
    throw failure('INVALID_IP', 'Expected a public IPv4 address, not a private or reserved address.');
  }
  return ip;
}

/** Pure checks; chain trust is enforced separately by the TLS handshake. */
export function validateCertificates({ ip, diskCertificate, peerCertificate, now = Date.now(), minimumValidityMs = MINIMUM_VALIDITY_MS }) {
  const disk = asCertificate(diskCertificate);
  const peer = asCertificate(peerCertificate);
  if (net.isIP(ip) !== 4) throw failure('INVALID_IP', 'Expected an IPv4 address.');
  if (!Number.isFinite(now) || !Number.isFinite(minimumValidityMs) || minimumValidityMs < 0) {
    throw failure('INVALID_VALIDITY_WINDOW', 'Invalid certificate validity window.');
  }
  for (const [label, certificate] of [['disk', disk], ['remote', peer]]) {
    if (!certificate.checkIP(ip)) throw failure('IP_SAN_MISMATCH', `${label} certificate does not cover IP ${ip}.`);
    const startsAt = Date.parse(certificate.validFrom);
    const expiresAt = Date.parse(certificate.validTo);
    if (!Number.isFinite(startsAt) || !Number.isFinite(expiresAt)) {
      throw failure('INVALID_CERTIFICATE_DATES', `${label} certificate has invalid validity dates.`);
    }
    if (startsAt > now) throw failure('CERTIFICATE_NOT_YET_VALID', `${label} certificate is not yet valid.`);
    if (expiresAt <= now) throw failure('CERTIFICATE_EXPIRED', `${label} certificate has expired.`);
    if (expiresAt - now < minimumValidityMs) {
      throw failure('CERTIFICATE_EXPIRING', `${label} certificate has less than ${minimumValidityMs / 3_600_000} hours remaining.`);
    }
  }
  if (disk.fingerprint256 !== peer.fingerprint256) {
    throw failure('CERTIFICATE_NOT_RELOADED', 'The remote TLS leaf certificate differs from the certificate on disk.');
  }
  return { expiresAt: new Date(disk.validTo).toISOString(), fingerprint256: disk.fingerprint256 };
}

/** No SNI is sent: Caddy must select its configured default certificate. */
export function readPeerCertificate({ ip, connectHost = '127.0.0.1', port = 443, timeoutMs = CONNECTION_TIMEOUT_MS }) {
  if (net.isIP(ip) !== 4) return Promise.reject(failure('INVALID_IP', 'Expected an IPv4 address.'));
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return Promise.reject(failure('INVALID_TIMEOUT', 'Invalid TLS timeout.'));
  return new Promise((resolve, reject) => {
    let socket;
    let timer;
    let settled = false;
    const finish = (error, certificate) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket?.destroy();
      if (error) reject(error);
      else resolve(certificate);
    };
    try {
      socket = tls.connect({
        host: connectHost,
        port,
        servername: '',
        rejectUnauthorized: true,
        // The TCP destination may be loopback; the identity must be the public IP.
        checkServerIdentity: (_host, certificate) => tls.checkServerIdentity(ip, certificate),
      });
      timer = setTimeout(() => finish(failure('TLS_TIMEOUT', `TLS connection timed out after ${timeoutMs} ms.`)), timeoutMs);
      socket.once('error', (error) => finish(error));
      socket.once('close', () => finish(failure('TLS_CLOSED', 'TLS connection closed before a certificate was verified.')));
      socket.once('secureConnect', () => {
        if (!socket.authorized) return finish(failure('TLS_UNAUTHORIZED', String(socket.authorizationError || 'TLS certificate is not trusted.')));
        const certificate = socket.getPeerX509Certificate();
        if (!certificate) return finish(failure('TLS_NO_CERTIFICATE', 'The remote server did not present a certificate.'));
        finish(null, certificate);
      });
    } catch (error) {
      finish(error);
    }
  });
}

async function writeStatus(output, status) {
  await fs.mkdir(path.dirname(output), { recursive: true });
  const temporary = `${output}.${process.pid}.${randomBytes(6).toString('hex')}.tmp`;
  try {
    await fs.writeFile(temporary, `${JSON.stringify(status, null, 2)}\n`, { mode: 0o644, flag: 'wx' });
    await fs.rename(temporary, output);
  } finally {
    await fs.unlink(temporary).catch((error) => { if (error.code !== 'ENOENT') throw error; });
  }
}

export async function runStatusCheck({ ip, certificate, output, connectHost = '127.0.0.1', port = 443, timeoutMs = CONNECTION_TIMEOUT_MS }) {
  const status = {
    checkedAt: new Date().toISOString(),
    ok: false,
    ip,
    connectHost,
    port,
    expiresAt: null,
    fingerprint256: null,
    error: null,
  };
  try {
    validatePublicIpv4(ip);
    const diskCertificate = new X509Certificate(await fs.readFile(certificate));
    status.expiresAt = new Date(diskCertificate.validTo).toISOString();
    status.fingerprint256 = diskCertificate.fingerprint256;
    const peerCertificate = await readPeerCertificate({ ip, connectHost, port, timeoutMs });
    Object.assign(status, validateCertificates({ ip, diskCertificate, peerCertificate }));
    status.ok = true;
  } catch (error) {
    status.error = { code: String(error.code || 'TLS_CHECK_FAILED'), message: String(error.message || error) };
  }
  await writeStatus(output, status);
  return status;
}

export function parseArguments(args) {
  const flags = new Map([
    ['--ip', 'ip'], ['--certificate', 'certificate'], ['--output', 'output'],
    ['--connect-host', 'connectHost'], ['--port', 'port'],
  ]);
  const options = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = flags.get(args[i]);
    if (!key || options[key] !== undefined || !args[i + 1] || args[i + 1].startsWith('--')) {
      throw failure('INVALID_ARGUMENTS', `Invalid or duplicate argument: ${args[i] || '(missing)'}`);
    }
    options[key] = args[i + 1];
  }
  for (const key of ['ip', 'certificate', 'output']) {
    if (!options[key]) throw failure('INVALID_ARGUMENTS', `Missing --${key}.`);
  }
  if (options.port !== undefined) {
    if (!/^\d+$/.test(options.port) || Number(options.port) < 1 || Number(options.port) > 65535) {
      throw failure('INVALID_ARGUMENTS', 'Port must be between 1 and 65535.');
    }
    options.port = Number(options.port);
  }
  return options;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    const status = await runStatusCheck(parseArguments(process.argv.slice(2)));
    console.log(JSON.stringify(status));
    process.exitCode = status.ok ? 0 : 1;
  } catch (error) {
    console.error(`${error.code || 'TLS_STATUS_ERROR'}: ${error.message}`);
    process.exitCode = 1;
  }
}
