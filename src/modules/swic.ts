// service-worker client interface,
// works on the frontend, not sw
import * as serviceWorkerRegistration from '../serviceWorkerRegistration'

export let swr: ServiceWorkerRegistration | null = null

class Client implements BackendClient {
  private reqs = new Map<number, { ok: (r: any) => void; rej: (r: any) => void }>()
  private nextReqId = 1
  private onRender: (() => void) | null = null
  private onReload: (() => void) | null = null
  private queue: (() => Promise<void> | void)[] = []
  private checkpointQueue: (() => Promise<void> | void)[] = []

  public async onStarted() {
    console.log('sw ready, queue', this.queue.length)
    while (this.queue.length) await this.queue.shift()!()
  }

  private callWhenStarted(cb: () => void) {
    if (swr && swr.active) cb()
    else this.queue.push(cb)
  }

  private async waitStarted() {
    return new Promise<void>((ok) => this.callWhenStarted(ok))
  }

  public async checkpoint() {
    console.log('backend client checkpoint queue', this.checkpointQueue.length)
    // take existing callbacks
    const cbs = this.checkpointQueue.splice(0, this.checkpointQueue.length)
    for (const cb of cbs) await cb()
  }

  public setOnRender(onRender: () => void) {
    this.onRender = onRender
  }

  public setOnReload(onReload: () => void) {
    this.onReload = onReload
  }

  public onMessage(data: BackendReply) {
    const { id, result, error } = data
    console.log('SW message', id, result, error)

    if (!id) {
      if (result === 'reload') {
        if (this.onReload) this.onReload()
      } else {
        if (this.onRender) this.onRender()
      }
      return
    }

    const r = this.reqs.get(id)
    if (!r) {
      console.log('Unexpected message from service worker', data)
      return
    }

    this.reqs.delete(id)
    this.checkpointQueue.push(() => {
      // a hacky way to let App handle onRender first
      // to update redux and only then we deliver the
      // reply
      if (error) r.rej(error)
      else r.ok(result)
    })
  }

  public async call(method: string, ...args: any[]) {
    await this.waitStarted()

    const id = this.nextReqId
    this.nextReqId++

    return new Promise((ok, rej) => {
      const call = async () => {
        if (!swr || !swr.active) {
          rej(new Error('No active service worker'))
          return
        }

        this.reqs.set(id, { ok, rej })
        const msg = {
          id,
          method,
          args: [...args],
        }
        console.log('sending to SW', msg)
        swr.active.postMessage(msg)
      }

      this.callWhenStarted(call)
    })
  }
}

const swClient = new Client()

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
    swr = r
    if (navigator.serviceWorker.controller) {
      console.log(`This page is currently controlled by: ${navigator.serviceWorker.controller}`)
    } else {
      console.log('This page is not currently controlled by a service worker.')
    }

    swClient.onStarted()
  })

  navigator.serviceWorker.addEventListener('message', (event) => {
    swClient.onMessage((event as MessageEvent).data)
  })
}


export const client: BackendClient = swClient
