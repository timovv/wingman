import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/cli.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'bin/wingman.js',
  banner: {
    js: '#!/usr/bin/env node'
  },
  packages: 'external',
});

console.log('CLI built successfully');
