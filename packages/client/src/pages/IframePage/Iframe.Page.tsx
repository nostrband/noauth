import { client } from '@/modules/client'
import { Typography } from '@mui/material'
import { NostrEvent } from '@nostr-dev-kit/ndk'
import { Event, validateEvent, verifySignature } from 'nostr-tools'
import { useEffect } from 'react'

let popup: WindowProxy | null = null

async function importNsec(data: any) {
  console.log('importing nsec', data)
  await client.importKeyIframe(data.nsec, data.appNpub)
}

async function openAuthUrl(url: string) {
  console.log('open auth url', url)
  try {
    const origin = new URL(url).origin
    if (origin !== window.location.origin) throw new Error('Bad auth url origin')
    popup = window.open(url, '_blank', 'width=400,height=700')
    if (!popup) throw new Error('Failed to open popup!')

    popup.addEventListener('load', () => {
      // give popup some time to start
      setTimeout(() => {
        console.log('popup loaded, registering iframe')
        const channel = new MessageChannel()
        popup!.postMessage(
          {
            method: 'registerIframe',
          },
          {
            targetOrigin: origin,
            transfer: [channel.port2],
          }
        )
        channel.port1.onmessage = (ev: MessageEvent) => {
          if (!ev.data || !ev.data.method) return
          if (ev.data.method === 'importNsec') {
            channel.port1.close()
            return importNsec(ev.data)
          }
        }
      }, 1000)
    })
  } catch (e) {
    console.log('bad auth url', url)
  }
}

const IframePage = () => {
  useEffect(() => {
    const onMessage = async (ev: MessageEvent) => {
      if (!ev.source) return
      if (ev.data?.authUrl) return openAuthUrl(ev.data?.authUrl)

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
        targetOrigin: ev.origin,
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
