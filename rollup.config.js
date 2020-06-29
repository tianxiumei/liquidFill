import typescript from 'rollup-plugin-typescript2'
import commonjs from 'rollup-plugin-commonjs'
import external from 'rollup-plugin-peer-deps-external'
import postcss from 'rollup-plugin-postcss'
import resolve from 'rollup-plugin-node-resolve'
import url from 'rollup-plugin-url'
import copy from 'rollup-plugin-copy-watch'
import svgr from '@svgr/rollup'

import pkg from './package.json'

export default {
  input: 'src/index.tsx',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'named'
    },
    {
      file: pkg.module,
      format: 'amd',
      exports: 'named',
      sourcemap: true
    }
  ],
  plugins: [
    external(),
    postcss({
      modules: true, // 增加 css-module 功能
      extensions: ['.less', '.css'],
      use: [
        [
          'less',
          {
            javascriptEnabled: true
          }
        ]
      ],
      extract: `index.css`
    }),
    url(),
    svgr(),
    resolve(),
    typescript({
      rollupCommonJSResolveHack: true,
      clean: true
    }),
    commonjs(),
    copy({
      watch: 'src',
      targets: [{ src: 'src/form.xml', dest: 'dist/' }]
    })
  ],
  external: ['lodash']
}
