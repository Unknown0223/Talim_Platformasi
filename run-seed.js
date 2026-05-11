/**
 * Seed ni backend papkasidan ishga tushiradi (backend/.env yuklanishi uchun).
 * Windows da "npm run seed --prefix backend" CALL xatosi bermasligi uchun.
 */
const { spawn } = require('child_process');
const path = require('path');

const backendDir = path.join(__dirname, 'backend');
const seedArgs = process.argv.slice(2);
const child = spawn('node', ['src/scripts/seed.js', ...seedArgs], {
  cwd: backendDir,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' },
});

child.on('error', (err) => {
  console.error('Seed xato:', err);
  process.exit(1);
});
child.on('exit', (code) => {
  process.exit(code ?? 0);
});
