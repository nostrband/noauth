import browser from 'webextension-polyfill'
import { ExtensionBackend } from '@/modules/ext-backend'

const getCurrentTab = async () => {
  const list = await browser.tabs.query({ active: true, currentWindow: true })
  return list[0]
}

const getOrigin = async () => {
  const tab = await getCurrentTab()
  if (!tab || !tab.url) return ''
  const url = new URL(tab.url)
  return url.origin
}

async function start() {
  const origin = await getOrigin()
  const backend = new ExtensionBackend(origin)
  await backend.start()
}

browser.runtime.onInstalled.addListener(() => {
  console.log('[background] loaded')
  start()
})

export {}
