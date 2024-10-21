import { StyledAppLogo } from '@/layout/Header/styled'
import { client } from '@/modules/client'
import { Button, Stack, Typography } from '@mui/material'
import { NostrEvent } from '@nostr-dev-kit/ndk'
import { Event, validateEvent, verifySignature } from 'nostr-tools'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { StyledButton } from './styled'
import { isDomainOrSubdomain } from '@/utils/helpers/helpers'
import { useAppSelector } from '@/store/hooks/redux'
import { selectKeys } from '@/store'

let popup: WindowProxy | null = null

async function importNsec(data: any) {
  console.log('importing nsec for app', data.appNpub)
  await client.importKeyIframe(data.nsec, data.appNpub)
}

async function openAuthUrl(url: string) {
  console.log(new Date(), 'open auth url', url)
  try {
    const hostname = new URL(url).hostname

    // auth url must be on the same domain or on subdomain
    if (!isDomainOrSubdomain(hostname, window.location.hostname)) throw new Error('Bad auth url origin')

    // specify non _blank to make sure popup has window.opener
    popup = window.open(url, 'nsec_app_auth_url' + Math.random(), 'width=400,height=700')
    if (!popup) throw new Error('Failed to open popup!')

    const onReady = async (e: MessageEvent) => {
      console.log(new Date(), 'iframe received message from popup', e)

      // is the popup talking?
      if (new URL(e.origin).hostname !== hostname || !e.source) {
        console.log('ignoring invalid origin event', e)
        return
      }

      // NOTE: we don't really care about the payload,
      // receiving a message from popup means it's ready

      console.log(new Date(), 'popup ready, registering iframe')
      const channel = new MessageChannel()
      e.source.postMessage(
        {
          method: 'registerIframe',
        },
        {
          targetOrigin: new URL(url).origin,
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
  const [logs, setLogs] = useState<string[]>([])
  const keys = useAppSelector(selectKeys)

  const authUrl = searchParams.get('auth_url') || ''

  const append = (s: string) => {
    setLogs((logs) => [...logs, new Date() + ': ' + s])
  }

  useEffect(() => {
    append('authUrl ' + authUrl)
    if (authUrl) return

    const onMessage = async (ev: MessageEvent) => {
      // NOTE: we don't do origin/source checks bcs
      // we don't care who's sending it - the comms are
      // e2e encrypted, we could be talking through
      // any number of middlemen and it wouldn't matter
      append(`got event source ${!!ev.source} origin ${ev.origin} data ${JSON.stringify(ev.data)}`)
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

      append('valid event')
      console.log('iframe request event', event)
      const reply = await client.processRequest(event as NostrEvent)
      append('reply: ' + JSON.stringify(reply))
      console.log('iframe reply event', reply)
      ev.source!.postMessage(reply, {
        targetOrigin: ev.origin,
      })
    }
    window.addEventListener('message', onMessage)

    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [authUrl])

  return (
    <>
      {!authUrl && (
        <Stack direction={'column'} gap={'1rem'}>
          <Typography>
            Nsec.app iframe worker, please start from <a href="/">here</a>.
          </Typography>
          {keys.map(k => (
            <Typography>{k.npub}</Typography>
          ))}
          {logs.map((l) => (
            <Typography>{l}</Typography>
          ))}
        </Stack>
      )}
      {authUrl && (
        <Stack direction={'row'} gap={'1rem'}>
          <StyledAppLogo />
          <StyledButton onClick={() => openAuthUrl(authUrl)}>Continue with Nsec.app</StyledButton>
        </Stack>
      )}
    </>
  )
}

export default IframePage
