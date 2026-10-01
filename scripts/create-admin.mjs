/**
 * Create or reset an administrator account.
 *
 *   npm run create-admin -- --email you@example.com --name "Your Name"
 *
 * Interactive when no flags are given. Used when the studio needs a second
 * administrator without touching the seed, or to reset a forgotten password.
 */
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

/**
 * Prisma 7 requires a driver adapter. The adapter takes a `mariadb.PoolConfig`
 * or a connection string — NOT `{ connectionString }`.
 */
const databaseUrl = new URL(process.env.DATABASE_URL);
const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || 3306),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: databaseUrl.pathname.replace(/^\//, ''),
    connectionLimit: 1,
    connectTimeout: 5000,
  }),
});

function arg(name, fallback = null) {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

async function prompt(question, { silent = false } = {}) {
  const rl = readline.createInterface({ input: stdin, output: stdout, terminal: true });
  if (!silent) {
    const answer = await rl.question(question);
    rl.close();
    return answer.trim();
  }

  // Suppress echo while reading a password.
  const output = rl.output;
  let value = '';
  const onData = (char) => {
    if (['\n', '\r', ''].includes(char.toString())) {
      output.write('\n');
    } else {
      value += char;
      output.write('*');
    }
  };
  rl.on('close', () => stdout.write('\n'));
  stdin.on('data', onData);
  const answer = await rl.question(question);
  stdin.off('data', onData);
  rl.close();
  return value.trim() || answer.trim();
}

async function main() {
  const email = (arg('email') || (await prompt('E-mail address: '))).toLowerCase();
  if (!email.includes('@')) {
    throw new Error('That does not look like an e-mail address.');
  }

  const name = arg('name') || (await prompt('Full name (optional): '));
  const password = arg('password') || (await prompt('Password (min. 10 characters): ', { silent: true }));

  if (password.length < 10) {
    throw new Error('Password must be at least 10 characters.');
  }

  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name: name || undefined, password: hash, role: 'ADMIN', isActive: true },
    create: { email, name: name || null, password: hash, role: 'ADMIN', isActive: true },
    select: { id: true, email: true, role: true, isActive: true },
  });

  console.log(`\nAdministrator ready: ${user.email} (id ${user.id})`);
}

main()
  .catch((error) => {
    console.error(`\nFailed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });