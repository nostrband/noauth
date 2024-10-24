const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = function override(config) {
  config.ignoreWarnings = [/Failed to parse source map/]
  const fallback = config.resolve.fallback || {}
  Object.assign(fallback, {
    http: require.resolve('stream-http'),
    path: require.resolve('path-browserify'),
    vm: false,
  })
  config.resolve.fallback = fallback
  config.resolve.alias = {
    '@': path.resolve(__dirname, 'src'),
  }

  if (process.env.BUILD_TARGET === 'ext-chrome') {
    config.entry = {
      main: './src/ext/popup.ts',
      background: './src/ext/background.ts',
      content: './src/ext/content.ts',
    }
    config.output = {
      ...config.output,
      filename: 'static/js/[name].js',
      chunkFilename: 'static/js/[name].js',
      path: path.resolve(__dirname, 'ext-build'),
    }
    config.plugins.push(
      new CopyPlugin({
        patterns: [{ from: 'src/ext/manifest.json', to: 'manifest.json' }],
      })
    )
  } else {
    config.output.path = path.resolve(__dirname, 'build')
  }

  return config
}
