
interface BackendRequest {
  id: number
  method: string
  args: any[]
}

interface BackendReply {
  id: number
  result: any
  error: string
}

interface BackendClient {
  // backend has sent some new data an UI needs
  // to re-render
  setOnRender: (onRender: () => void) => void

  // for service-worker only, when new version of
  // sw is ready and we need to show 'Reload' button to user
  setOnReload: (onReload: () => void) => void

  // called by app after it handles the onRender
  // and updates all UI with all new data received
  // from backend, this will deliver all pending
  // method call replies, so that they're delivered
  // after UI has made all updates using the call's 
  // side effects
  checkpoint: () => Promise<void>

  // send an RPC to the backend
  call: (method: string, ...args: any[]) => Promise<any>
}