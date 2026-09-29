'use strict';

const path = require('node:path');
const { spawnSync } = require('node:child_process');

const tests = [
  'ai-knowledge-store.cjs',
  'ai-products.cjs',
  'ai-provider.cjs',
  'ai-runtime.cjs',
  'ai-settings-controller.cjs',
  'ai-main-integration.cjs',
  'ai-pdd-send-ack.cjs',
  'ai-xhs-ack.cjs',
  'local-ai-renderer.cjs'
];

let failures = 0;
for (const file of tests) {
  const result = spawnSync(process.execPath, [path.join(__dirname, file)], {
    cwd: path.resolve(__dirname, '..'), encoding: 'utf8', timeout: 60000
  });
  if (result.status === 0 && !result.error) {
    console.log('PASS ' + file);
  } else {
    failures++;
    console.error('FAIL ' + file);
    if (result.error) console.error(result.error.message);
    if (result.stdout) process.stderr.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }
}
console.log(`${tests.length - failures}/${tests.length} acceptance scripts passed.`);
process.exitCode = failures ? 1 : 0;
