import { StyledAppLogo } from '@/layout/Header/styled'
import { client } from '@/modules/client'
import { Button, Stack, Typography } from '@mui/material'
import { NostrEvent } from '@nostr-dev-kit/ndk'
import { Event, validateEvent, verifySignature } from 'nostr-tools'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { StyledButton } from './styled'

let popup: WindowProxy | null = null

async function importNsec(data: any) {
  console.log('importing nsec for app', data.appNpub)
  await client.importKeyIframe(data.nsec, data.appNpub)
}

async function openAuthUrl(url: string) {
  console.log(new Date(), 'open auth url', url)
  try {
    const origin = new URL(url).origin
    if (origin !== window.origin) throw new Error('Bad auth url origin')
    // specify non _blank to make sure popup has window.opener
    popup = window.open(url, 'nsec_app_auth_url', 'width=400,height=700')
    if (!popup) throw new Error('Failed to open popup!')

    const onReady = async (e: MessageEvent) => {
      if (e.origin !== window.origin) {
        console.log('ignoring invalid origin event', e)
        return
      }

      console.log(new Date(), 'popup ready, registering iframe')
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
        // console.log('message from popup', ev)
        if (ev.data.method === 'importNsec') {
          channel.port1.close()
          return importNsec(ev.data)
        }
      }

      window.removeEventListener('message', onReady)
    }

    window.addEventListener('message', onReady)
  } catch (e) {
    console.log('bad auth url', url, e)
  }
}

const IframePage = () => {
  const [searchParams] = useSearchParams()

  const authUrl = searchParams.get('auth_url') || ''

  useEffect(() => {
    if (authUrl || !window.opener) return

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

      console.log('iframe request event', event)
      const reply = await client.processRequest(event as NostrEvent)
      console.log('iframe reply event', reply)
      ev.source!.postMessage(reply, {
        targetOrigin: ev.origin,
      })
    }
    window.addEventListener('message', onMessage)

    // ask the opener to continue
    console.log(new Date(), "popup loaded, informing opener");
    window.opener.postMessage(
      {
        method: 'readyIframe',
      },
      {
        targetOrigin: window.opener.origin,
      }
    )

    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [authUrl])

  return (
    <>
      {!authUrl && (
        <Typography>
          Nsec.app iframe worker, please start from <a href="/">here</a>.
        </Typography>
      )}
      {authUrl && (
        <Stack direction={'row'} gap={'1rem'}>
          <StyledAppLogo />
          {window.opener && <StyledButton onClick={() => openAuthUrl(authUrl)}>Continue with Nsec.app</StyledButton>}
          {!window.opener && <Typography color="red">Error: empty window.opener.</Typography>}
        </Stack>
      )}
    </>
  )
}

export default IframePage
