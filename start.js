/**
 * Ishga tushirish: backend va frontendni bir vaqtda ishga tushiradi.
 * Windows va boshqa OS larda ishlashi uchun.
 */
const { spawn } = require('child_process');
const path = require('path');

const root = __dirname;

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const backend = spawn(npmCmd, ['start'], {
  cwd: path.join(root, 'backend'),
  shell: true,
  stdio: 'inherit',
  env: process.env,
});

const frontend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(root, 'frontend'),
  shell: true,
  stdio: 'inherit',
});

backend.on('error', (err) => {
  console.error('Backend xato:', err);
});
frontend.on('error', (err) => {
  console.error('Frontend xato:', err);
});

function exit(code) {
  backend.kill();
  frontend.kill();
  process.exit(code || 0);
}

backend.on('exit', (code) => {
  if (code !== null && code !== 0) exit(code);
});
frontend.on('exit', (code) => {
  if (code !== null && code !== 0) exit(code);
});

process.on('SIGINT', () => exit(0));
process.on('SIGTERM', () => exit(0));

console.log('Backend: http://localhost:5000');
console.log('Frontend: http://localhost:5173');
console.log("To'xtatish: Ctrl+C\n");
