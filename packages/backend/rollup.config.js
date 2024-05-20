import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import json from '@rollup/plugin-json'
import inject from '@rollup/plugin-inject'
import alias from '@rollup/plugin-alias'

export default {
  input: 'index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    commonjs(),
    json(),
    alias({
      entries: [
        { find: 'assert', replacement: 'assert' },
        // { find: 'crypto', replacement: 'crypto-browserify' },
        { find: 'https', replacement: 'https-browserify' },
        { find: 'os', replacement: 'os-browserify' },
        { find: 'stream', replacement: 'stream-browserify' },
        // { find: 'http', replacement: 'stream-http' },
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
    }),
    terser({
      compress: {
        toplevel: true,
      },
    }),
  ],
  external: ['ws', 'http'],
}
