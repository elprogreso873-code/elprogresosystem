import { spawnSync } from 'child_process';

process.env.VITE_STRICT_BUILD = 'true';

const result = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);
