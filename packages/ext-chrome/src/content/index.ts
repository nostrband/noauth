import { runtime } from 'webextension-polyfill'
console.log('[content] loaded ', { runtime })

// add a naive counter
let count = 0

type Listener = (event: MouseEvent) => void

function registerClickListener(listener: Listener) {
  window.addEventListener('click', listener)
}

function countClicks() {
  count++
  console.log('click(): ', count)
  return runtime.sendMessage({
    from: 'content',
    to: 'background',
    action: 'click',
  })
}

export function init() {
  registerClickListener(countClicks)
}

init()
