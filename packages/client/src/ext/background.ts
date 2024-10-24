import { ServiceWorkerBackend } from '@/modules/sw'

declare const self: ServiceWorkerGlobalScope

async function start() {
  console.log('[background]: start backend')
  const backend = new ServiceWorkerBackend(self)
  await backend.start()
}

start()
