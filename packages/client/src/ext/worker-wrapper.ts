try {
  if ('function' === typeof importScripts) {
    importScripts('/static/js/background.js', '/static/js/browser-polyfill.js')
  }
} catch (e) {
  console.log(e)
}
