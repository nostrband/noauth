import { isDomainOrSubdomain } from '@/utils/helpers/helpers'
import { useEffect, useState } from 'react'

let globalPort: MessagePort | undefined

function useIframePort(isPopup: boolean) {
  const [port, setPort] = useState(globalPort)

  // console.log("useIframePort isPopup", isPopup, globalPort);
  useEffect(() => {
    if (!isPopup || globalPort) return

    // ask the opener to continue,
    // opener might be cross-origin (sub-domain) so
    // we don't try to check opener's origin and just
    // post to whoever understands it
    console.log(new Date(), 'popup loaded, informing opener')
    window.opener.postMessage(
      {
        method: 'ready',
      }
    )

    // subscribe to receive opener's port,
    // port will be passed to service worker to
    // talk to the opener
    const onMessage = async (ev: MessageEvent) => {
      console.log('popup got message', ev)
      if (ev.origin !== window.location.origin) return
      if (!ev.source) return
      if (ev.data && ev.data.method === 'registerIframe') {
        console.log('registered iframe port', ev.data)
        globalPort = ev.ports[0]
        setPort(globalPort)
        return
      }
    }
    window.addEventListener('message', onMessage)

    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [isPopup])

  return port
}

export default useIframePort
