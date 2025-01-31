import { App, URLOpenListenerEvent } from '@capacitor/app'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export const useHandleAppLink = () => {
  const navigate = useNavigate()

  useEffect(() => {
    App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
      try {
        const urlObject = new URL(event.url)
        if (!urlObject) return

        const { pathname, search } = urlObject

        navigate({ pathname, search })
      } catch (error) {
        console.log('Error: Invalid applink URL')
      }
    })
  }, [navigate])
}
