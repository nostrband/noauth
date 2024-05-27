const path = require('path')

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {}
  Object.assign(fallback, {
    http: require.resolve('stream-http'),
  })
  config.resolve.fallback = fallback
  config.resolve.alias = {
    '@': path.resolve(__dirname, 'src'),
  }
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
