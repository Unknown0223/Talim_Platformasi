import net from 'node:net';
import { execSync } from 'node:child_process';

const PORT = Number(process.argv[2] || process.env.PORT || 5001);

function checkBind(port, host) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => srv.close(() => resolve(true)));
    try { srv.listen(port, host); } catch { resolve(false); }
  });
}

async function isPortFree(port) {
  // Both IPv4 and IPv6 must be free, since the backend may listen on either.
  const v4 = await checkBind(port, '0.0.0.0');
  const v6 = await checkBind(port, '::');
  return v4 && v6;
}

function killPidsWindows(port) {
  const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' }).toString();
  const pids = new Set();
  for (const line of out.split(/\r?\n/)) {
    const m = line.match(/LISTENING\s+(\d+)/);
    if (m) pids.add(m[1]);
  }
  for (const pid of pids) {
    try {
      execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      console.log(`  - PID ${pid} o'chirildi`);
    } catch {
      // jarayon allaqachon yo'q bo'lishi mumkin
    }
  }
}

function killPidsUnix(port) {
  try {
    execSync(`lsof -ti tcp:${port} | xargs -r kill -9`, { stdio: 'ignore', shell: '/bin/sh' });
  } catch {
    // hech kim band qilmayapti yoki lsof yo'q
  }
}

async function main() {
  if (await isPortFree(PORT)) {
    console.log(`[freePort] Port ${PORT} bo'sh, davom etamiz.`);
    return;
  }
  console.log(`[freePort] Port ${PORT} band - eski jarayonni topib o'chirilmoqda...`);
  try {
    if (process.platform === 'win32') killPidsWindows(PORT);
    else killPidsUnix(PORT);
  } catch (err) {
    console.error('[freePort] Xatolik:', err.message);
  }
  await new Promise((r) => setTimeout(r, 800));
  if (await isPortFree(PORT)) {
    console.log(`[freePort] Port ${PORT} endi bo'sh.`);
  } else {
    console.warn(`[freePort] Port ${PORT} hamon band - qo'lda tekshiring.`);
  }
}

main();
