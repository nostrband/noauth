import { FC } from 'react'
import { StyledAppLogo } from '@/layout/Header/styled'
import { client } from '@/modules/client'
import { Stack, Typography } from '@mui/material'
import { NostrEvent } from '@nostr-dev-kit/ndk'
import { Event, nip19, validateEvent, verifySignature } from 'nostr-tools'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { StyledButton } from './styled'
import { isDomainOrSubdomain } from '@/utils/helpers/helpers'
import { useAppSelector } from '@/store/hooks/redux'
import { selectKeys } from '@/store'
import { ADMIN_DOMAIN } from '@/utils/consts'
import { DbKey } from '@noauth/common'
import { ERROR_NO_KEY } from '@noauth/backend/src/const'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'

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

const IframeStarter: FC<{ authUrl: string; rebind: boolean }> = (props) => {
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
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

    setLoading(true)

    try {
      const popupOrigin = url.origin

      // specify non _blank to make sure popup has window.opener
      popup = window.open(url.href, 'nsec_app_auth_url' + Math.random(), 'width=400,height=700')
      if (!popup) throw new Error('Failed to open popup!')

      // we'll send channel port to the popup
      const channel = new MessageChannel()

      // if popup is closed and we haven't received 'importNsec'
      // then user probably rejected and we return proper error code
      const timeout = setInterval(() => {
        if (popup!.closed) {
          console.log('Popup closed without reply!')
          window.removeEventListener('message', onReady)
          const reply = props.rebind ? ['rebinderError'] : ['starterError']
          reply.push('Popup did not reply')
          channel.port1.close()
          setLoading(false)
        }
      }, 100)

      // when popup is ready we register ourselves
      // and wait for importNsec command
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
            // stop timeout
            clearInterval(timeout)

            // close channel
            channel.port1.close()

            // import
            await importNsec(ev.data)

            // send reply
            const reply = props.rebind ? ['rebinderDone'] : ['starterDone']
            if (!props.rebind && ev.data.connectReply) reply.push(ev.data.connectReply)
            console.log('starter sending ready to parent', reply)
            window.parent.postMessage(reply, '*')

            setLoading(false)
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
      {ready && !loading && (
        <Stack direction={'column'} gap={'0.2rem'}>
          <Stack direction={'row'} gap={'1rem'} alignItems={'center'} justifyContent={'center'}>
            <StyledAppLogo />
            <Typography>Nsec.app</Typography>
          </Stack>
          {isValidAuthUrl && <StyledButton onClick={() => openAuthUrl()}>Continue</StyledButton>}
          {!isValidAuthUrl && <Typography color={'red'}>Bad auth url</Typography>}
        </Stack>
      )}
      {(!ready || loading) && (
        <Stack direction={'row'} gap={'1rem'} alignItems={'center'} justifyContent={'center'}>
          <LoadingSpinner mode="secondary" size={'2rem'} />
        </Stack>
      )}
      {false && logs.map((l) => <Typography>{l}</Typography>)}
    </Stack>
  )
}

const IframeWorker: FC<{ keys: DbKey[] }> = (props) => {
  const [logs, setLogs] = useState<string[]>([])
  const [started, setStarted] = useState(false)

  const append = (s: string) => {
    setLogs((logs) => [...logs, new Date() + ': ' + s])
  }

  const start = async () => {
    console.log('worker sending ready to parent')
    append('sw ready')

    // create channel btw sw and client
    const channel = new MessageChannel()

    // send port1 to sw
    await client.registerIframeWorker(channel.port1)

    // send port2 to client
    window.parent.postMessage(['workerReady', channel.port2], '*', [channel.port2])

    // SW might be stopped if inactive, this way we try to keep it alive
    setInterval(() => {
      console.log("ping worker");
      client.ping().then(() => console.log("pong worker"))
    }, 10000)
  }

  useEffect(() => {
    append('start ' + started)
    if (!started) {
      setStarted(true)
      append('waiting for sw')
      try {
        navigator.serviceWorker.ready.then(start).catch((e) => append('async error ' + e))
      } catch (e) {
        append('error ' + e)
      }
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
  const connect = searchParams.get('connect') || ''
  const rebindPubkey = searchParams.get('rebind') || ''
  const keys = useAppSelector(selectKeys)

  if (connect) {
    if (!connect.startsWith('nostrconnect://')) throw new Error('Bad nostrconnect url')
    const authUrl = `https://${ADMIN_DOMAIN}/${connect}`
    return <IframeStarter authUrl={authUrl} rebind={false} />
  } else if (rebindPubkey) {
    const pubkey = searchParams.get('pubkey') || ''
    const npub = nip19.npubEncode(pubkey)
    const appNpub = nip19.npubEncode(rebindPubkey)
    const authUrl = `https://${ADMIN_DOMAIN}/key/${npub}?rebind=true&appNpub=${appNpub}&popup=true`
    console.log('rebind url', authUrl)
    return <IframeStarter authUrl={authUrl} rebind={true} />
  } else {
    return <IframeWorker keys={keys} />
  }
}

export default IframePage
