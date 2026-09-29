import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import tls from 'node:tls';
import { X509Certificate } from 'node:crypto';
import { execFile, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { validateCertificates, validatePublicIpv4, readPeerCertificate, runStatusCheck, parseArguments } from './ip-tls-status.mjs';

const execFileAsync = promisify(execFile);
const script = fileURLToPath(new URL('./ip-tls-status.mjs', import.meta.url));
const publicIp = '93.184.216.34';
let directory;
let certificate;
let replacement;
let key;
let certificatePath;
let replacementPath;
let caPath;

before(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), 'juhe-ip-tls-test-'));
  const candidates = process.env.OPENSSL ? [process.env.OPENSSL] : [
    'openssl', 'C:\\Program Files\\Git\\usr\\bin\\openssl.exe', 'C:\\Program Files\\Git\\mingw64\\bin\\openssl.exe',
  ];
  const openssl = candidates.find((candidate) => spawnSync(candidate, ['version'], { windowsHide: true }).status === 0);
  assert.ok(openssl, 'OpenSSL is required to generate the ephemeral test CA and certificates.');
  const run = (args) => execFileAsync(openssl, args, { cwd: directory, windowsHide: true });
  // Only ephemeral test keys are created, in an OS temporary directory.
  await run(['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'ca.key', '-out', 'ca.pem', '-days', '7', '-subj', '/CN=Juhe temporary test CA', '-addext', 'basicConstraints=critical,CA:TRUE']);
  await fs.writeFile(path.join(directory, 'leaf.ext'), `basicConstraints=critical,CA:FALSE\nkeyUsage=critical,digitalSignature,keyEncipherment\nextendedKeyUsage=serverAuth\nsubjectAltName=IP:${publicIp}\n`, 'utf8');
  await run(['req', '-newkey', 'rsa:2048', '-nodes', '-keyout', 'leaf.key', '-out', 'leaf.csr', '-subj', '/CN=Juhe temporary test server']);
  await run(['x509', '-req', '-in', 'leaf.csr', '-CA', 'ca.pem', '-CAkey', 'ca.key', '-set_serial', '1', '-out', 'leaf.pem', '-days', '5', '-extfile', 'leaf.ext']);
  await run(['x509', '-req', '-in', 'leaf.csr', '-CA', 'ca.pem', '-CAkey', 'ca.key', '-set_serial', '2', '-out', 'replacement.pem', '-days', '5', '-extfile', 'leaf.ext']);
  certificatePath = path.join(directory, 'leaf.pem');
  replacementPath = path.join(directory, 'replacement.pem');
  caPath = path.join(directory, 'ca.pem');
  certificate = new X509Certificate(await fs.readFile(certificatePath));
  replacement = new X509Certificate(await fs.readFile(replacementPath));
  key = await fs.readFile(path.join(directory, 'leaf.key'));
});

after(async () => { if (directory) await fs.rm(directory, { recursive: true, force: true }); });

function validate(overrides = {}) {
  return validateCertificates({ ip: publicIp, diskCertificate: certificate, peerCertificate: certificate, ...overrides });
}

async function listen(server) {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return server.address().port;
}

async function close(server) {
  await new Promise((resolve) => server.close(resolve));
}

async function cli(port, outputName, diskPath = certificatePath, { trusted = true, ip = publicIp, insecureEnvironment = false } = {}) {
  const output = path.join(directory, outputName);
  const env = { ...process.env };
  // The app always checks trust. Tests add their own ephemeral CA to Node's trust store.
  delete env.NODE_TLS_REJECT_UNAUTHORIZED;
  delete env.NODE_EXTRA_CA_CERTS;
  if (trusted) env.NODE_EXTRA_CA_CERTS = caPath;
  if (insecureEnvironment) env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  let execution;
  try {
    execution = await execFileAsync(process.execPath, [script, '--ip', ip, '--certificate', diskPath, '--output', output, '--port', String(port)], { env, windowsHide: true });
    execution.code = 0;
  } catch (error) {
    execution = error;
  }
  return { execution, status: JSON.parse(await fs.readFile(output, 'utf8')) };
}

test('accepts a matching, valid IP certificate', () => {
  const result = validate();
  assert.equal(result.fingerprint256, certificate.fingerprint256);
  assert.equal(result.expiresAt, new Date(certificate.validTo).toISOString());
});

test('rejects a different IP SAN', () => {
  assert.throws(() => validate({ ip: '93.184.216.35' }), { code: 'IP_SAN_MISMATCH' });
});

test('rejects expired, not yet valid, and under-48-hour certificates', () => {
  assert.throws(() => validate({ now: Date.parse(certificate.validTo) }), { code: 'CERTIFICATE_EXPIRED' });
  assert.throws(() => validate({ now: Date.parse(certificate.validFrom) - 1 }), { code: 'CERTIFICATE_NOT_YET_VALID' });
  assert.throws(() => validate({ now: Date.parse(certificate.validTo) - 48 * 3_600_000 + 1 }), { code: 'CERTIFICATE_EXPIRING' });
  assert.ok(validate({ now: Date.parse(certificate.validTo) - 48 * 3_600_000 }));
});

test('detects a certificate renewal that has not been loaded by the server', () => {
  assert.throws(() => validate({ diskCertificate: replacement }), { code: 'CERTIFICATE_NOT_RELOADED' });
});

test('validates public IPv4 and strict CLI port options', () => {
  assert.equal(validatePublicIpv4(publicIp), publicIp);
  for (const ip of ['127.0.0.1', '192.168.1.1', '172.16.0.1', '10.1.1.1', '100.64.0.1', '203.0.113.1', '::1', '999.1.2.3']) {
    assert.throws(() => validatePublicIpv4(ip), { code: 'INVALID_IP' });
  }
  assert.equal(parseArguments(['--ip', publicIp, '--certificate', 'fullchain.pem', '--output', 'status.json', '--port', '443']).port, 443);
  assert.throws(() => parseArguments(['--ip', publicIp, '--certificate', 'fullchain.pem', '--output', 'status.json', '--port', '443x']), { code: 'INVALID_ARGUMENTS' });
  assert.throws(() => parseArguments(['--ip', publicIp, '--ip', publicIp]), { code: 'INVALID_ARGUMENTS' });
});

test('times out a TCP server that never completes TLS and persists failure status', async () => {
  const sockets = new Set();
  const server = net.createServer((socket) => { sockets.add(socket); socket.once('close', () => sockets.delete(socket)); });
  const port = await listen(server);
  try {
    await assert.rejects(readPeerCertificate({ ip: publicIp, port, timeoutMs: 50 }), { code: 'TLS_TIMEOUT' });
    const output = path.join(directory, 'timeout-status.json');
    const result = await runStatusCheck({ ip: publicIp, certificate: certificatePath, output, port, timeoutMs: 50 });
    assert.equal(result.ok, false);
    assert.equal(result.error.code, 'TLS_TIMEOUT');
    assert.deepEqual(JSON.parse(await fs.readFile(output, 'utf8')), result);
    assert.ok(result.checkedAt);
  } finally {
    for (const socket of sockets) socket.destroy();
    await close(server);
  }
});

test('real TLS CLI validates trusted IP without SNI, rejects untrusted or wrong IP, and checks reload', async () => {
  const observedServernames = [];
  const server = tls.createServer({
    key,
    cert: certificate.toString(),
    SNICallback: (servername, callback) => {
      observedServernames.push(servername);
      callback(new Error('This server requires a TLS handshake without SNI.'));
    },
  }, (socket) => socket.end());
  server.on('tlsClientError', () => {});
  const port = await listen(server);
  try {
    const good = await cli(port, 'good.json');
    assert.equal(good.execution.code, 0, good.execution.stderr);
    assert.equal(good.status.ok, true);
    assert.equal(good.status.error, null);
    assert.equal(good.status.fingerprint256, certificate.fingerprint256);
    assert.equal(observedServernames.length, 0, 'IP TLS probes must not send SNI.');

    const untrusted = await cli(port, 'untrusted.json', certificatePath, { trusted: false });
    assert.equal(untrusted.execution.code, 1);
    assert.equal(untrusted.status.ok, false);
    assert.match(untrusted.status.error.code, /CERT|ISSUER|VERIFY_LEAF_SIGNATURE/);

    const insecureEnv = await cli(port, 'insecure-env.json', certificatePath, { trusted: false, insecureEnvironment: true });
    assert.equal(insecureEnv.execution.code, 1, 'An insecure parent environment must not disable this TLS check.');
    assert.equal(insecureEnv.status.ok, false);
    assert.match(insecureEnv.status.error.code, /CERT|ISSUER|VERIFY_LEAF_SIGNATURE/);

    const wrongIp = await cli(port, 'wrong-ip.json', certificatePath, { ip: '93.184.216.35' });
    assert.equal(wrongIp.execution.code, 1);
    assert.equal(wrongIp.status.error.code, 'ERR_TLS_CERT_ALTNAME_INVALID');

    const stale = await cli(port, 'stale.json', replacementPath);
    assert.equal(stale.execution.code, 1);
    assert.equal(stale.status.error.code, 'CERTIFICATE_NOT_RELOADED');
    assert.doesNotMatch(JSON.stringify(stale.status), /BEGIN (RSA )?PRIVATE KEY/);
  } finally {
    await close(server);
  }
});
