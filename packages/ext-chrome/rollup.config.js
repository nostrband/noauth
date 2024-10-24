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
  // {
  //   input: '../client/src/index.tsx',
  //   output: {
  //     file: 'dist/popup.js',
  //     format: 'es',
  //     inlineDynamicImports: true,
  //   },
  //   plugins: [
  //     resolve({
  //       extensions: ['.js', '.jsx', '.ts', '.tsx'],
  //     }),
  //     commonjs(),
  //     typescript({
  //       tsconfig: '../client/tsconfig.json',
  //     }),
  //     babel({
  //       extensions: ['.js', '.jsx', '.ts', '.tsx'],
  //       babelHelpers: 'bundled',
  //       presets: ['@babel/preset-react', '@babel/preset-typescript'],
  //     }),
  //     postcss({
  //       extensions: ['.css'],
  //       minimize: true, // Минификация CSS
  //       inject: true, // Внедрение стилей в JS
  //     }),
  //   ],
  // },
]
