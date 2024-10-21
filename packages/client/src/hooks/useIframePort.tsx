import { isDomainOrSubdomain } from '@/utils/helpers/helpers'
import { useEffect, useState } from 'react'

let globalPort: MessagePort | undefined

function useIframePort(isPopup: boolean) {
  const [port, setPort] = useState(globalPort)

  useEffect(() => {
    if (!isPopup || globalPort || !window.opener) return

    // subscribe to receive starter's port,
    // port will be passed to service worker to
    // talk to the starter iframe embedded in the calling app
    const onMessage = async (ev: MessageEvent) => {
      console.log('popup got message', ev)
      // check message sender (might be our subdomain)
      if (!isDomainOrSubdomain(window.location.hostname, new URL(ev.origin).hostname)) return
      if (!ev.source) return
      if (ev.data && ev.data.method === 'registerIframeStarter') {
        console.log('registered starter port', ev.data)
        globalPort = ev.ports[0]
        setPort(globalPort)
        return
      }
    }
    window.addEventListener('message', onMessage)

    // we're ready to register the starter
    console.log(new Date(), 'popup loaded, sending ready to starter')
    window.opener.postMessage('ready', '*')

    // cleanup
    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [isPopup])

  return port
}

export default useIframePort
