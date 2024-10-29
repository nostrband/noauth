import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import postcss from 'rollup-plugin-postcss'
import image from '@rollup/plugin-image'
import svgr from '@svgr/rollup'
import nodePolyfills from 'rollup-plugin-node-polyfills'
import babel from '@rollup/plugin-babel'
import dotenv from 'rollup-plugin-dotenv'

export default [
  {
    input: 'src/index.tsx',
    output: {
      dir: 'dist',
      format: 'umd',
      sourcemap: true,
      inlineDynamicImports: true,
      name: 'App',
    },
    plugins: [
      babel({
        babelHelpers: 'bundled',
        presets: ['@babel/preset-react'],
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      }),
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      nodePolyfills(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: ['**/*.test.tsx', '**/*.test.ts', '**/*.stories.ts'],
      }),
      dotenv(),
      postcss({ extensions: ['.css'], inject: true, extract: false }),
      svgr({}),
      image({
        include: ['**/*.png', '**/*.jpg', '**/*.gif', '**/*.svg'],
      }),
    ],
  },
]
