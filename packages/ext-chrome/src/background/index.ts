import { runtime } from 'webextension-polyfill'

type Message = {
  from: string
  to: string
  action: string
}

export function init() {
  // the message receiver
  runtime.onMessage.addListener((message: Message) => {
    if (message.to === 'background') {
      console.log('background handled: ', message.action)
    }
    return true
  })

  console.log('[background] loaded ', { runtime })
}

runtime.onInstalled.addListener(() => {
  init()
})
