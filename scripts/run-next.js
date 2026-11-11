const { spawn } = require('node:child_process');
const path = require('node:path');

const command = process.argv[2];
const distDirectories = {
  dev: '.next-dev',
  build: '.next-build',
  start: '.next-build',
};

if (!distDirectories[command]) {
  console.error('Usage: node scripts/run-next.js <dev|build|start>');
  process.exit(2);
}

const nextBin = path.join(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');
const child = spawn(process.execPath, [nextBin, command], {
  stdio: 'inherit',
  env: { ...process.env, NEXT_DIST_DIR: distDirectories[command] },
});

child.on('error', (error) => {
  console.error(`Unable to start Next.js: ${error.message}`);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
