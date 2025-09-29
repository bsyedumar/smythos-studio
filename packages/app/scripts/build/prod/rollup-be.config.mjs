// rollup.config.js
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import path from 'path';
import copy from 'rollup-plugin-copy';
import esbuild from 'rollup-plugin-esbuild';
import { typescriptPaths } from 'rollup-plugin-typescript-paths';
import pkg from '../../../package.json' with { type: 'json' };
// Determine build mode from environment variable (default to production for this config)
const isProduction = process.env.NODE_ENV !== 'development'; // Default to production unless explicitly dev
const isDevelopment = process.env.NODE_ENV === 'development';

console.log(`Building app backend in ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);

// Node.js built-in modules that should always be external
const nodeBuiltins = [
  'fs',
  'path',
  'crypto',
  'util',
  'stream',
  'events',
  'buffer',
  'querystring',
  'url',
  'zlib',
  'http',
  'https',
  'net',
  'tls',
  'os',
  'process',
  'child_process',
  'cluster',
  'worker_threads',
  'perf_hooks',
  'async_hooks',
  'inspector',
  'v8',
  'vm',
  // Node.js built-ins with 'node:' prefix
  'node:sqlite',
  'node:fs',
  'node:path',
  'node:crypto',
  'node:util',
  'node:stream',
  'node:events',
  'node:buffer',
  'node:querystring',
  'node:url',
  'node:zlib',
  'node:http',
  'node:https',
  'node:net',
  'node:tls',
  'node:os',
  'node:process',
  'node:child_process',
  'node:cluster',
  'node:worker_threads',
  'node:perf_hooks',
  'node:async_hooks',
  'node:inspector',
  'node:v8',
  'node:vm',
];

const projectRootDir = path.resolve('..', '..', '..');

//custom warnings handler
const onwarn = function (warning, warn) {
  // Check if the warning originates from node_modules
  if (warning.loc && warning.loc.file && warning.loc.file.includes('node_modules')) {
    // Ignore warnings from node_modules
    return;
  }
  // Otherwise, print the warning as usual
  warn(warning);
};

// Development configuration: fast builds, external dependencies
const devConfig = {
  input: './src/backend/index.ts',
  output: {
    dir: './dist/server',
    format: 'esm',
    sourcemap: true,
  },
  plugins: [
    typescriptPaths({
      tsconfig: '../../../tsconfig.json',
      preserveExtensions: true,
      nonRelative: false,
    }),
    esbuild({
      treeShaking: true,
      minify: true,
    }),
    nodeResolve({
      preferBuiltins: true,
      exportConditions: ['node'],
    }),
    commonjs({
      include: /node_modules/,
      dynamicRequireTargets: [
        path.join(projectRootDir, 'node_modules/ejs/**/*.js'),
        path.join(projectRootDir, 'node_modules/**/*.js'),
        '../../../node_modules/ejs/**/*.js',
        '../../../node_modules/ejs/**/*',
        'node_modules/ejs/**/*.js',
        '../../../views/**/*.ejs',
        'ejs',
      ],
      dynamicRequireRoot: projectRootDir,
      ignoreDynamicRequires: false,
    }),
    json({
      compact: true,
    }),
    // copy static files to dist/static
    copy({
      targets: [
        {
          src: 'static/',
          dest: 'dist/',
        },
      ],
    }),
  ],
  // Keep all dependencies external for faster builds
  external: [...nodeBuiltins, ...Object.keys(pkg.dependencies)],
  onwarn,
};

// Production configuration: single bundle file, all dependencies included
const prodConfig = {
  input: './src/backend/index.ts',
  output: {
    file: './dist/server/index.cjs',
    format: 'cjs', // Use CommonJS format for bundled production build
    sourcemap: true,
    inlineDynamicImports: true,
  },
  plugins: [
    // Node resolution plugin to resolve modules from node_modules
    nodeResolve({
      preferBuiltins: true,
      exportConditions: ['node'],
    }),
    // CommonJS plugin to convert CommonJS modules to ES modules
    commonjs({
      include: /node_modules/,
      ignoreDynamicRequires: true,
    }),
    typescriptPaths({
      tsconfig: '../../../tsconfig.json',
      preserveExtensions: true,
      nonRelative: false,
    }),
    esbuild({
      treeShaking: true,
      minify: true, // Enable minification for production
    }),
    json({
      compact: true,
    }),
    // copy static files and views to dist
    copy({
      targets: [
        {
          src: 'static/',
          dest: 'dist/',
        },
        {
          src: 'views/',
          dest: 'dist/',
        },
      ],
    }),
  ],
  // Only keep Node.js built-in modules as external (bundle EJS)
  external: nodeBuiltins,
  onwarn,
};

export default [isDevelopment ? devConfig : prodConfig];
