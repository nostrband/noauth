import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import dotenv from 'rollup-plugin-dotenv'

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
    dotenv(),
    typescript({
      tsconfig: 'tsconfig.json',
    }),
    terser({
      compress: {
        toplevel: true,
      },
    }),
  ],
  external: ['http', 'ws', '@noauth/common', '@noauth/backend'],
}
