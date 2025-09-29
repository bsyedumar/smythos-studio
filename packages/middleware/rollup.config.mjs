import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import copy from 'rollup-plugin-copy';
import esbuild from 'rollup-plugin-esbuild';
import sourcemaps from 'rollup-plugin-sourcemaps';
import pkg from './package.json' with { type: 'json' };

// Determine build mode from environment variable
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production' || !isDevelopment;

console.log(`Building in ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'} mode`);

// Node.js built-in modules that should always be external
const nodeBuiltins = [
  'fs', 'path', 'crypto', 'util', 'stream', 'events', 'buffer',
  'querystring', 'url', 'zlib', 'http', 'https', 'net', 'tls',
  'os', 'process', 'child_process', 'cluster', 'worker_threads',
  'perf_hooks', 'async_hooks', 'inspector', 'v8', 'vm'
];

// Development configuration: fast builds, external dependencies
const devConfig = {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.dev.js',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    esbuild({ sourceMap: true }),
    json(),
    sourcemaps(),
    copy({
      targets: [{ src: ['src/views/*'], dest: 'dist/views' }],
    }),
  ],
  // Keep all dependencies external for faster builds
  external: [
    ...nodeBuiltins,
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {})
  ],
};

// Production configuration: single bundle file, all dependencies included
const prodConfig = {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.cjs',
    format: 'cjs', // Use CommonJS format to avoid ES module issues
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
    }),
    esbuild({ sourceMap: true }),
    json(),
    sourcemaps(),
    copy({
      targets: [{ src: ['src/views/*'], dest: 'dist/views' }],
    }),
  ],
  // Only keep Node.js built-in modules as external
  external: nodeBuiltins,
};

export default {
  ...(isDevelopment ? devConfig : prodConfig),
  onwarn(warning, warn) {
    // Ignore circular deps
    if (warning.code === "CIRCULAR_DEPENDENCY") return;
    // Ignore unresolved externals
    if (warning.code === "UNRESOLVED_IMPORT") return;

    // Default handler
    warn(warning);
  }
};
