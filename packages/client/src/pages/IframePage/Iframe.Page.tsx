import { FC } from 'react'
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
  const url = parseAuthUrl(props.authUrl)
  const isValidAuthUrl = !!url;

  async function openAuthUrl() {
    if (!url) return;

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

        if (e.data !== 'ready') return

        // is the popup talking?
        if (new URL(e.origin).origin !== popupOrigin || !e.source) {
          console.log('ignoring invalid ready event', e)
          return
        }

        console.log(new Date(), 'popup ready, registering starter')
        const channel = new MessageChannel()
        e.source.postMessage(
          {
            method: 'registerIframeStarter',
          },
          {
            // make sure only expected origin can receive it
            targetOrigin: popupOrigin,
            transfer: [channel.port2],
          }
        )
        channel.port1.onmessage = async (ev: MessageEvent) => {
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
    }
  }

  return (
    <Stack direction={'row'} gap={'1rem'}>
      <StyledAppLogo />
      {isValidAuthUrl && <StyledButton onClick={() => openAuthUrl()}>Continue with Nsec.app</StyledButton>}
      {!isValidAuthUrl && <Typography color={'red'}>Bad auth url</Typography>}
    </Stack>
  )
}

const IframeWorker = () => {
  const [logs, setLogs] = useState<string[]>([])
  const keys = useAppSelector(selectKeys)

  const append = (s: string) => {
    setLogs((logs) => [...logs, new Date() + ': ' + s])
  }

  useEffect(() => {
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
    navigator.serviceWorker.ready.then(() => {
      console.log('worker sending ready to parent')
      window.parent.postMessage('workerReady', '*')
    })

    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [])

  return (
    <Stack direction={'column'} gap={'1rem'}>
      <Typography>
        Nsec.app iframe worker, please start from <a href="/">here</a>.
      </Typography>
      {keys.map((k) => (
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
  if (authUrl) return <IframeStarter authUrl={authUrl} />
  else return <IframeWorker />

  // const [logs, setLogs] = useState<string[]>([])
  // const keys = useAppSelector(selectKeys)

  // const append = (s: string) => {
  //   setLogs((logs) => [...logs, new Date() + ': ' + s])
  // }

  // const isValidAuthUrl = authUrl && isDomainOrSubdomain(new URL(authUrl).hostname, window.location.hostname)

  // async function openAuthUrl(url: string) {
  //   console.log(new Date(), 'open auth url', url)

  //   // auth url must be on the same domain or on subdomain
  //   if (!isValidAuthUrl) throw new Error('Bad auth url origin')

  //   try {
  //     const hostname = new URL(url).hostname

  //     // specify non _blank to make sure popup has window.opener
  //     popup = window.open(url, 'nsec_app_auth_url' + Math.random(), 'width=400,height=700')
  //     if (!popup) throw new Error('Failed to open popup!')

  //     const onReady = async (e: MessageEvent) => {
  //       console.log(new Date(), 'iframe received message from popup', e)

  //       // is the popup talking?
  //       if (new URL(e.origin).hostname !== hostname || !e.source) {
  //         console.log('ignoring invalid origin event', e)
  //         return
  //       }

  //       // NOTE: we don't really care about the payload,
  //       // receiving a message from popup means it's ready

  //       console.log(new Date(), 'popup ready, registering iframe')
  //       const channel = new MessageChannel()
  //       e.source.postMessage(
  //         {
  //           method: 'registerIframe',
  //         },
  //         {
  //           targetOrigin: new URL(url).origin,
  //           transfer: [channel.port2],
  //         }
  //       )
  //       channel.port1.onmessage = async (ev: MessageEvent) => {
  //         if (!ev.data || !ev.data.method) return
  //         // console.log('message from popup', ev)
  //         if (ev.data.method === 'importNsec') {
  //           channel.port1.close()
  //           await importNsec(ev.data)

  //           console.log('starter sending ready to parent')
  //           window.parent.postMessage('ready', '*')
  //         }
  //       }

  //       window.removeEventListener('message', onReady)
  //     }

  //     window.addEventListener('message', onReady)
  //   } catch (e) {
  //     console.log('bad auth url', url, e)
  //   }
  // }

  // useEffect(() => {
  //   append('authUrl ' + authUrl)
  //   if (authUrl) return

  //   const onMessage = async (ev: MessageEvent) => {
  //     // NOTE: we don't do origin/source checks bcs
  //     // we don't care who's sending it - the comms are
  //     // e2e encrypted, we could be talking through
  //     // any number of middlemen and it wouldn't matter
  //     append(`got event source ${!!ev.source} origin ${ev.origin} data ${JSON.stringify(ev.data)}`)
  //     if (!ev.source) return

  //     let event: NostrEvent | undefined
  //     try {
  //       event = ev.data
  //       if (!validateEvent(event)) return
  //       if (!verifySignature(event as Event)) return
  //     } catch (e) {
  //       console.log('invalid frame event', e, ev)
  //       return
  //     }

  //     append('valid event')
  //     console.log('iframe request event', event)
  //     const reply = await client.processRequest(event as NostrEvent)
  //     append('reply: ' + JSON.stringify(reply))
  //     console.log('iframe reply event', reply)
  //     ev.source!.postMessage(reply, {
  //       targetOrigin: ev.origin,
  //     })
  //   }
  //   window.addEventListener('message', onMessage)

  //   // now after all set wait until service worker starts
  //   // and notify the parent
  //   navigator.serviceWorker.ready.then(() => {
  //     console.log('worker sending ready to parent')
  //     window.parent.postMessage('ready', '*')
  //   })

  //   return () => {
  //     window.removeEventListener('message', onMessage)
  //   }
  // }, [authUrl])

  // return (
  //   <>
  //     {!authUrl && (
  //       <Stack direction={'column'} gap={'1rem'}>
  //         <Typography>
  //           Nsec.app iframe worker, please start from <a href="/">here</a>.
  //         </Typography>
  //         {keys.map((k) => (
  //           <Typography>{k.npub}</Typography>
  //         ))}
  //         {logs.map((l) => (
  //           <Typography>{l}</Typography>
  //         ))}
  //       </Stack>
  //     )}
  //     {authUrl && (
  //       <Stack direction={'row'} gap={'1rem'}>
  //         <StyledAppLogo />
  //         {isValidAuthUrl && <StyledButton onClick={() => openAuthUrl(authUrl)}>Continue with Nsec.app</StyledButton>}
  //         {!isValidAuthUrl && <Typography color={'red'}>Bad auth url</Typography>}
  //       </Stack>
  //     )}
  //   </>
  // )
}

export default IframePage
