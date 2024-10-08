import { client } from '@/modules/client'
import { Typography } from '@mui/material'
import { NostrEvent } from '@nostr-dev-kit/ndk'
import { Event, validateEvent, verifySignature } from 'nostr-tools'
import { useEffect } from 'react'

const IframePage = () => {
  useEffect(() => {
    const onMessage = async (ev: MessageEvent) => {
      if (!ev.source) return

      let event: NostrEvent | undefined
      try {
        event = ev.data
        if (!validateEvent(event)) return
        if (!verifySignature(event as Event)) return
      } catch (e) {
        console.log('invalid frame event', e, ev)
        return
      }

      const reply = await client.processRequest(event as NostrEvent)
      console.log('iframe reply event', reply)
      ev.source!.postMessage(reply, {
        targetOrigin: ev.origin
      })
    }
    window.addEventListener('message', onMessage)

    return () => {
      window.removeEventListener('message', onMessage)
    }
  })

  return (
    <>
      <Typography>
        Nsec.app iframe worker, please start from <a href="/">here</a>.
      </Typography>
    </>
  )
}

export default IframePage
