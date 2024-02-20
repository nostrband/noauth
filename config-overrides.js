const webpack = require('webpack')
const path = require('path')
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin')

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {}
  Object.assign(fallback, {
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    assert: require.resolve('assert'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    os: require.resolve('os-browserify'),
    url: require.resolve('url'),
  })
  config.resolve.fallback = fallback
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
  ])
  config.module.rules.unshift({
    test: /\.m?js$/,
    resolve: {
      fullySpecified: false, // disable the behavior
    },
  })
  // turns off the plugin that forbids importing from node_modules for the above-mentioned stuff
  config.resolve.plugins = config.resolve.plugins.filter((plugin) => {
    return !(plugin instanceof ModuleScopePlugin)
  })

  config.resolve.alias = {
    '@': path.resolve(__dirname, 'src'),
  }

  return config
}
