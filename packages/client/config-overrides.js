const path = require('path')
const webpack = require('webpack')
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {}
  Object.assign(fallback, {
    http: require.resolve('stream-http'),
    path: require.resolve('path-browserify'),
  })
  config.resolve.fallback = fallback
  config.resolve.alias = {
    '@': path.resolve(__dirname, 'src'),
  }
  config.plugins.push(
    new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
      resource.request = resource.request.replace(/^node:/, '')
    }),
    new NodePolyfillPlugin()
  )
  config.module.rules.push({
    test: /\service-worker.ts$/,
    use: [
      {
        loader: 'webpack-conditional-loader',
        options: {
          condition: process.env.REACT_APP_HOSTED === 'false',
        },
      },
    ],
  })
  return config
}
