// service-worker client interface,
// works on the frontend, not sw
import * as serviceWorkerRegistration from '../serviceWorkerRegistration'

export let swr: ServiceWorkerRegistration | null = null
const reqs = new Map<number, { ok: (r: any) => void; rej: (r: any) => void }>()
let nextReqId = 1
let onRender: (() => void) | null = null
let onReload: (() => void) | null = null
const queue: (() => Promise<void> | void)[] = []
const checkpointQueue: (() => Promise<void> | void)[] = []

export async function swicRegister() {
  serviceWorkerRegistration.register({
    onSuccess(registration) {
      console.log('sw registered')
      swr = registration
    },
    onError(e) {
      console.log('sw error', e)
    },
    onUpdate() {
      // tell new SW that it should activate immediately
      swr?.waiting?.postMessage({ type: 'SKIP_WAITING' })
    },
  })

  navigator.serviceWorker.ready.then(async (r) => {
    console.log('sw ready, queue', queue.length)
    swr = r
    if (navigator.serviceWorker.controller) {
      console.log(`This page is currently controlled by: ${navigator.serviceWorker.controller}`)
    } else {
      console.log('This page is not currently controlled by a service worker.')
    }

    while (queue.length) await queue.shift()!()
  })

  navigator.serviceWorker.addEventListener('message', (event) => {
    onMessage((event as MessageEvent).data)
  })
}

export function swicWaitStarted() {
  return new Promise<void>((ok) => {
    if (swr && swr.active) ok()
    else queue.push(ok)
  })
}

export async function swicCheckpoint() {
  console.log("swicCheckpoint queue", checkpointQueue.length)
  // take existing callbacks
  const cbs = checkpointQueue.splice(0, checkpointQueue.length)
  for (const cb of cbs)
    await cb()
}

function onMessage(data: any) {
  const { id, result, error } = data
  console.log('SW message', id, result, error)

  if (!id) {
    if (result === 'reload') {
      if (onReload) onReload()
    } else {
      if (onRender) onRender()
    }
    return
  }

  const r = reqs.get(id)
  if (!r) {
    console.log('Unexpected message from service worker', data)
    return
  }

  reqs.delete(id)
  checkpointQueue.push(() => {
    // a hacky way to let App handle onRender first
    // to update redux and only then we deliver the
    // reply
    if (error) r.rej(error)
    else r.ok(result)
  })
}

export async function swicCall(method: string, ...args: any[]) {
  const id = nextReqId
  nextReqId++

  return new Promise((ok, rej) => {
    const call = async () => {
      if (!swr || !swr.active) {
        rej(new Error('No active service worker'))
        return
      }

      reqs.set(id, { ok, rej })
      const msg = {
        id,
        method,
        args: [...args],
      }
      console.log('sending to SW', msg)
      swr.active.postMessage(msg)
    }

    if (swr && swr.active) call()
    else queue.push(call)
  })
}

export function swicOnRender(cb: () => void) {
  onRender = cb
}

export function swicOnReload(cb: () => void) {
  onReload = cb
}
