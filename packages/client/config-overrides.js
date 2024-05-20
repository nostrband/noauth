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
  return config
}
