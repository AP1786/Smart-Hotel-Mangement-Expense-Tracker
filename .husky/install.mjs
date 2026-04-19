import { existsSync } from 'node:fs';

if (!existsSync('.git')) {
  console.log('Skipping Husky install because .git is not initialized yet.');
  process.exit(0);
}

const husky = (await import('husky')).default;

husky();
