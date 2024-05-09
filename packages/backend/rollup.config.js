import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import alias from '@rollup/plugin-alias'
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import json from '@rollup/plugin-json'

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
    json(),
    alias({
      entries: [
        { find: 'crypto', replacement: 'crypto-browserify' },
        { find: 'stream', replacement: 'stream-browserify' },
        { find: 'assert', replacement: 'assert' },
        { find: 'http', replacement: 'stream-http' },
        { find: 'https', replacement: 'https-browserify' },
        { find: 'os', replacement: 'os-browserify' },
        { find: 'url', replacement: 'url' },
      ],
    }),
    nodePolyfills(),
    resolve({
      browser: true,
      preferBuiltins: false,
    }),
    commonjs(),
    typescript({
      tsconfig: 'tsconfig.json',
    }),
    terser({
      compress: {
        toplevel: true,
      },
    }),
  ],
}
