import { useEffect, useState } from 'react'

let globalPort: MessagePort | undefined

function useIframePort(isPopup: boolean) {
  const [port, setPort] = useState(globalPort)

  // console.log("useIframePort isPopup", isPopup, globalPort);
  useEffect(() => {
    if (!isPopup || globalPort) return

    const onMessage = async (ev: MessageEvent) => {
      // console.log('message', ev)
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
