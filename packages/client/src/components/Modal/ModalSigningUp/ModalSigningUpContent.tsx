import { FC, memo, useCallback, useEffect } from 'react'
import { generateNip05, getReferrerAppUrl, parseNostrConnectMeta } from '@/utils/helpers/helpers'
import { client } from '@/modules/client'
import { useSearchParams } from 'react-router-dom'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Stack } from '@mui/material'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { useUnmount } from 'usehooks-ts'
import { CreateConnectParams } from '@noauth/backend'
import useIframePort from '@/hooks/useIframePort'
import { nip19 } from 'nostr-tools'

const isPopup = false

export const ModalSigningUpContent: FC = memo(() => {
  const { createHandleClose } = useModalSearchParams()
  const handleCloseModal = createHandleClose(MODAL_PARAMS_KEYS.SIGNING_UP, {
    onClose: (sp) => {
      sp.delete('email')
      sp.delete('connect')
    },
    replace: true,
  })

  const notify = useEnqueueSnackbar()

  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const nostrconnect = searchParams.get('connect') || ''

  const { port, referrer } = useIframePort(true)

  const handleGenerateKeyConnect = useCallback(async () => {
    try {
      if (!email || !nostrconnect || !nostrconnect.startsWith('nostrconnect://')) return handleCloseModal()

      const nostrconnectURL = new URL(nostrconnect)
      const appPubkey = nostrconnectURL.host

      // const key = await client.generateKeyForEmail(name, email)

      const name = await generateNip05()
      const appNpub = nip19.npubEncode(appPubkey)
      const appUrl = referrer || getReferrerAppUrl()

      const params: CreateConnectParams = {
        name,
        email,
        port,
        appNpub,
        appUrl,
        perms: '', /// ???
        password: '', /// ???
      }
      const npub = await client.generateKeyConnect(params)
      notify('New key successfully created: ' + npub, 'success')

      const meta = parseNostrConnectMeta(nostrconnectURL.search)
      if (!meta) return

      const requestId = await client.nostrConnect(npub, nostrconnect, {
        appName: meta.appName,
        appUrl: meta.appUrl,
        appIcon: meta.appIcon,
        perms: meta.perms,
      })

      console.log('requestId', { requestId })

      handleCloseModal()
      if (isPopup) window.close()
    } catch (error: any) {
      notify('Error: ' + error.toString(), 'error')
      handleCloseModal()
    }
    // eslint-disable-next-line
  }, [email, nostrconnect])

  useEffect(() => {
    handleGenerateKeyConnect()
  }, [handleGenerateKeyConnect])

  useUnmount(() => {
    searchParams.delete('email')
    searchParams.delete('connect')
  })

  return (
    <Stack height={'150px'} alignItems={'center'} justifyContent={'center'}>
      <LoadingSpinner size={40} mode="secondary" />
    </Stack>
  )
})
