import { FC, memo, useCallback, useEffect } from 'react'
import { generateNip05, getReferrerAppUrl, parseNostrConnectMeta } from '@/utils/helpers/helpers'
import { client } from '@/modules/client'
import { useSearchParams } from 'react-router-dom'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Stack, Typography } from '@mui/material'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { useUnmount } from 'usehooks-ts'
import { CreateConnectParams } from '@noauth/backend'
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

  const handleGenerateKeyConnect = useCallback(async () => {
    try {
      if (!email || !nostrconnect || !nostrconnect.startsWith('nostrconnect://')) return handleCloseModal()

      const nostrconnectURL = new URL(nostrconnect)
      const appPubkey = nostrconnectURL.host
      const meta = parseNostrConnectMeta('?' + nostrconnectURL.search)
      if (!meta) throw new Error('Bad nostrconnect metadata')

      const name = await generateNip05(email.split('@')[0])
      const appNpub = nip19.npubEncode(appPubkey)
      // FIXME why referrer? Is it more reliable?
      // are we gonna use the URL for our welcome email
      // and to redirect back to the app after email confirmed?
      const appUrl = getReferrerAppUrl() || meta.appUrl

      // create key and add this new app as "connected"
      const params: CreateConnectParams = {
        name,
        email,
        appNpub,
        appUrl,
        perms: meta.perms,
        password: '',
      }
      const npub = await client.generateKeyConnect(params)

      // now process nostrconnect request by this app
      const requestId = await client.nostrConnect(npub, nostrconnect, {
        appName: meta.appName,
        appUrl,
        appIcon: meta.appIcon,
        perms: meta.perms,
      })

      console.log('requestId', { requestId })

      // let people see the spinner and realize what's happening
      await new Promise((ok) => setTimeout(ok, 3000))

      // done
      notify('New key successfully created: ' + npub, 'success')

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
    <Stack gap={'1rem'} height={'150px'} alignItems={'center'} justifyContent={'center'}>
      <Typography>Generating Nostr keys...</Typography>
      <LoadingSpinner size={40} mode="secondary" />
    </Stack>
  )
})
