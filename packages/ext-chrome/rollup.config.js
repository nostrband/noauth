import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import { terser } from 'rollup-plugin-terser'
import copy from 'rollup-plugin-copy'
import babel from '@rollup/plugin-babel'
import postcss from 'rollup-plugin-postcss'

export default [
  {
    input: 'src/background/index.ts',
    output: {
      file: 'dist/background.js',
      format: 'iife',
      name: 'Background',
      sourcemap: true,
    },
    plugins: [
      typescript({ sourceMap: true }),
      resolve(),
      commonjs(),
      terser(),
      copy({
        targets: [{ src: 'src/public/manifest.json', dest: 'dist/' }],
      }),
    ],
  },
  {
    input: 'src/content/index.ts',
    output: {
      file: 'dist/content.js',
      format: 'iife',
      name: 'Content',
      sourcemap: true,
    },
    plugins: [typescript({ sourceMap: true }), , resolve(), commonjs(), terser()],
  },
]
