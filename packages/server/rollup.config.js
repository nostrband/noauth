const commonjs = require('@rollup/plugin-commonjs')
const typescript = require('@rollup/plugin-typescript')
const terser = require('@rollup/plugin-terser')
const dotenv = require('rollup-plugin-dotenv')

module.exports = {
  input: 'index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
    },
  ],

  plugins: [
    commonjs(),
    dotenv.default(),
    typescript({
      tsconfig: 'tsconfig.json',
    }),
    terser({
      compress: {
        toplevel: true,
      },
    }),
  ],
  external: ['http', 'ws'], //, '@noauth/common', '@noauth/backend'],
}
