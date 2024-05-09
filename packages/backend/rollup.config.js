import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
// import alias from '@rollup/plugin-alias'
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import json from '@rollup/plugin-json'
import inject from '@rollup/plugin-inject'
import alias from '@rollup/plugin-alias'

export default {
  input: 'index.ts',
  output: [
    {
      file: 'dist/index.cjs.js',
      format: 'cjs',
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
    },
  ],
  plugins: [
    commonjs(),
    json(),
    // nodePolyfills(),
    alias({
      entries: [
        { find: 'assert', replacement: 'assert' },
        { find: 'crypto', replacement: 'crypto-browserify' },
        { find: 'https', replacement: 'https-browserify' },
        { find: 'os', replacement: 'os-browserify' },
        { find: 'stream', replacement: 'stream-browserify' },
        { find: 'http', replacement: 'stream-http' },
        { find: 'url', replacement: 'url' },
      ],
    }),
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    typescript({
      tsconfig: 'tsconfig.json',
    }),
    inject({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
      // global: ['globalthis', 'window'],
    }),
    terser({
      compress: {
        toplevel: true,
      },
    }),
  ],
}
