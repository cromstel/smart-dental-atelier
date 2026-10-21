#!/usr/bin/env node
/**
 * Starts Next.js on the port configured in the environment.
 *
 * Why this exists: Next.js reads `PORT` from the *process* environment, and
 * its own documentation says it "cannot be set in `.env` as booting up the HTTP
 * server happens before any other code is initialized" — the port is chosen
 * before the env files are loaded. The `-p` flag is the only reliable way to
 * hand it a value.
 *
 * So the port lives in exactly one place (the env file), and this script
 * reads it there and passes it on. The real environment still wins, which is
 * what Docker, Compose and Kubernetes rely on.
 *
 *   node scripts/run-next.mjs dev     -> next dev --port <PORT>
 *   node scripts/run-next.mjs start   -> next start --port <PORT>
 *
 * When no port is configured, no flag is passed and Next.js uses its own
 * default — so no port number is hardcoded anywhere in this repository.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Reads a key from an env file. Later files win, matching Next.js' own
 * precedence (`.env` < `.env.local`).
 */
function readEnvFile(file, key) {
  try {
    const line = fs
      .readFileSync(path.join(projectRoot, file), 'utf8')
      .split(/\r?\n/)
      .find((entry) => entry.trim().startsWith(`${key}=`));
    if (!line) return undefined;
    return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
  } catch {
    return undefined;
  }
}

function configuredPort() {
  // The real environment wins, then `.env.local`, then `.env`.
  return (
    process.env.PORT ||
    readEnvFile('.env.local', 'PORT') ||
    readEnvFile('.env', 'PORT') ||
    ''
  );
}

const command = process.argv[2];
if (!['dev', 'start', 'build'].includes(command)) {
  console.error('Usage: node scripts/run-next.mjs <dev|start|build>');
  process.exit(1);
}

const port = configuredPort();
const args = [command];
if (port) args.push('--port', port);

// `HOST` decides the bind address. Next.js already listens on every
// interface by default, so it is only passed when it is set explicitly —
// e.g. `HOST=0.0.0.0` to make the app reachable from other devices on the
// local network.
const host = process.env.HOST || readEnvFile('.env.local', 'HOST') || readEnvFile('.env', 'HOST');
if (host) args.push('--hostname', host);

// The Next.js CLI is a Node script, so it is run through the current
// interpreter rather than through the `.cmd` shim: no shell, no argument
// quoting, and no deprecation warning on Windows.
const nextCli = path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next');

console.log(
  `[run-next] ${command}${port ? ` on port ${port}` : ' (default port)'}` +
    `${host ? ` on ${host}` : ''}`,
);

const child = spawn(process.execPath, [nextCli, ...args], {
  cwd: projectRoot,
  stdio: 'inherit',
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}
