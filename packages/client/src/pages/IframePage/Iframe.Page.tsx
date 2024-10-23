import { FC } from 'react'
import { StyledAppLogo } from '@/layout/Header/styled'
import { client } from '@/modules/client'
import { Stack, Typography } from '@mui/material'
import { NostrEvent } from '@nostr-dev-kit/ndk'
import { Event, validateEvent, verifySignature } from 'nostr-tools'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { StyledButton } from './styled'
import { isDomainOrSubdomain, parseRebindToken } from '@/utils/helpers/helpers'
import { useAppSelector } from '@/store/hooks/redux'
import { selectKeys } from '@/store'
import { ADMIN_DOMAIN } from '@/utils/consts'
import { DbKey } from '@noauth/common'

let popup: WindowProxy | null = null

async function importNsec(data: any) {
  console.log('importing nsec for app', data.appNpub)
  await client.importKeyIframe(data.nsec, data.appNpub)
}

function parseAuthUrl(url: string) {
  try {
    const u = new URL(url)
    if (!isDomainOrSubdomain(u.hostname, window.location.hostname)) throw new Error('Invalid auth url domain')
    return u
  } catch (e) {
    console.log('Invalid auth url', e, url)
    return undefined
  }
}

const IframeStarter: FC<{ authUrl: string }> = (props) => {
  const [ready, setReady] = useState(false)
  const [logs, setLogs] = useState<string[]>([])

  const append = (s: string) => {
    setLogs((logs) => [...logs, new Date() + ': ' + s])
  }

  useEffect(() => {
    // NOTE: if we don't wait until sw is launched then
    // it seems like Safari will pause the execution of it
    // when user clicks 'Continue' and another tab opens,
    // and then when user is done and 'importNsec arrives
    // the SW never proceeds.
    navigator.serviceWorker.ready.then(() => setReady(true))
  }, [])

  const url = parseAuthUrl(props.authUrl)
  const isValidAuthUrl = !!url

  async function openAuthUrl() {
    if (!url) return

    console.log(new Date(), 'open auth url', url.href)

    // auth url must be on the same domain or on subdomain
    if (!isValidAuthUrl) throw new Error('Bad auth url origin')

    try {
      const popupOrigin = url.origin

      // specify non _blank to make sure popup has window.opener
      popup = window.open(url.href, 'nsec_app_auth_url' + Math.random(), 'width=400,height=700')
      if (!popup) throw new Error('Failed to open popup!')

      const onReady = async (e: MessageEvent) => {
        console.log(new Date(), 'starter received message from popup', e)
        append('popup ready ' + e.data)

        if (e.data !== 'ready') return

        // is the popup talking?
        if (new URL(e.origin).origin !== popupOrigin || !e.source) {
          console.log('ignoring invalid ready event', e)
          append('bad ready event')
          return
        }

        console.log(new Date(), 'popup ready, registering starter')
        const channel = new MessageChannel()
        e.source.postMessage(
          {
            method: 'registerIframeStarter',
            referrer: document.referrer || '',
          },
          {
            // make sure only expected origin can receive it
            targetOrigin: popupOrigin,
            transfer: [channel.port2],
          }
        )
        append('sent registerIframeStarter')
        channel.port1.onmessage = async (ev: MessageEvent) => {
          append('got port message ' + ev.data)
          if (!ev.data || !ev.data.method) return
          // console.log('message from popup', ev)
          if (ev.data.method === 'importNsec') {
            channel.port1.close()
            await importNsec(ev.data)

            console.log('starter sending ready to parent')
            window.parent.postMessage('starterDone', '*')
          }
        }

        // cleanup
        window.removeEventListener('message', onReady)
      }

      window.addEventListener('message', onReady)
    } catch (e) {
      console.error('Failed to start with a popup', url, e)
      append('error ' + e)
    }
  }

  return (
    <Stack direction={'column'} gap={'0rem'}>
      {ready && (
        <Stack direction={'row'} gap={'1rem'}>
          <StyledAppLogo />
          {isValidAuthUrl && <StyledButton onClick={() => openAuthUrl()}>Continue with Nsec.app</StyledButton>}
          {!isValidAuthUrl && <Typography color={'red'}>Bad auth url</Typography>}
        </Stack>
      )}
      {!ready && <Typography>Launching...</Typography>}
      {logs.map((l) => (
        <Typography>{l}</Typography>
      ))}
    </Stack>
  )
}

const IframeWorker: FC<{ keys: DbKey[] }> = (props) => {
  const [logs, setLogs] = useState<string[]>([])
  const [started, setStarted] = useState(false)

  const append = (s: string) => {
    setLogs((logs) => [...logs, new Date() + ': ' + s])
  }

  useEffect(() => {
    append('start ' + started)
    setStarted(true)

    // nip46 over postMessage
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

    // now after all set wait until service worker starts
    // and notify the parent that we're ready to work
    if (!started) {
      append('waiting for sw')
      try {
        navigator.serviceWorker.ready
          .then(() => {
            console.log('worker sending ready to parent')
            append('sw ready')
            window.parent.postMessage('workerReady', '*')
          })
          .catch((e) => append('async error ' + e))
      } catch (e) {
        append('error ' + e)
      }
    }

    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [started])

  return (
    <Stack direction={'column'} gap={'1rem'}>
      <Typography>
        Nsec.app iframe worker, please start from <a href="/">here</a>.
      </Typography>
      {props.keys.map((k) => (
        <Typography>{k.npub}</Typography>
      ))}
      {logs.map((l) => (
        <Typography>{l}</Typography>
      ))}
    </Stack>
  )
}

const IframePage = () => {
  const [searchParams] = useSearchParams()
  const authUrl = searchParams.get('auth_url') || ''
  const token = searchParams.get('token') || ''
  const keys = useAppSelector(selectKeys)

  if (authUrl) {
    return <IframeStarter authUrl={authUrl} />
  } else if (token) {
    const { npub } = parseRebindToken(token)
    if (!npub) return <Typography color={"red"}>Bad token</Typography>
    const url = `https://${ADMIN_DOMAIN}/key/${npub}?rebind=true&token=${token}&popup=true`
    return <IframeStarter authUrl={url} />
  } else {
    return <IframeWorker keys={keys} />
  }
}

export default IframePage
