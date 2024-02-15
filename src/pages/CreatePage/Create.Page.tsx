import { Stack, Typography } from '@mui/material'
import { GetStartedButton, LearnMoreButton } from './styled'
import { DOMAIN } from '@/utils/consts'
import { useSearchParams } from 'react-router-dom'
import { swicCall } from '@/modules/swic'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { ModalConfirmConnect } from '@/components/Modal/ModalConfirmConnect/ModalConfirmConnect'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { useState } from 'react'
import { getReferrerAppUrl } from '@/utils/helpers/helpers'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'

const CreatePage = () => {
  const notify = useEnqueueSnackbar()
  const { handleOpen } = useModalSearchParams()
  const [created, setCreated] = useState(false)

  const [searchParams] = useSearchParams()

  const [isLoading, setIsLoading] = useState(false)

  const name = searchParams.get('name') || ''
  const token = searchParams.get('token') || ''
  const appNpub = searchParams.get('appNpub') || ''
  const isValid = name && token && appNpub

  const nip05 = `${name}@${DOMAIN}`

  const handleLearnMore = () => {
    // @ts-ignore
    window.open(`https://${DOMAIN}`, '_blank').focus()
  }

  const handleClickAddAccount = async () => {
    try {
      setIsLoading(true)
      const key: any = await swicCall('generateKey', name)

      const appUrl = getReferrerAppUrl()

      console.log('Created', key.npub, 'app', appUrl)
      setCreated(true)
      setIsLoading(false)

      handleOpen(MODAL_PARAMS_KEYS.CONFIRM_CONNECT, {
        search: {
          npub: key.npub,
          appNpub,
          appUrl,
          token,
          // needed for this screen itself
          name,
          // will close after all done
          popup: 'true',
        },
        replace: true,
      })
    } catch (error: any) {
      notify(error.message || error.toString(), 'error')
      setIsLoading(false)
    }
  }

  if (!isValid) {
    return (
      <Stack maxHeight={'100%'} overflow={'auto'}>
        <Typography textAlign={'center'} variant="h6" paddingTop="1em">
          Bad parameters.
        </Typography>
      </Stack>
    )
  }

  return (
    <>
      <Stack maxHeight={'100%'} overflow={'auto'}>
        {created && (
          <>
            <Typography textAlign={'center'} variant="h4" paddingTop="0.5em">
              Account created!
            </Typography>
            <Typography textAlign={'center'} variant="body1" paddingTop="0.5em">
              User name: <b>{nip05}</b>
            </Typography>
          </>
        )}
        {!created && (
          <>
            <Typography textAlign={'center'} variant="h4" paddingTop="0.5em">
              Welcome to Nostr!
            </Typography>
            <Stack gap={'0.5rem'} overflow={'auto'}>
              <Typography textAlign={'left'} variant="h6" paddingTop="0.5em">
                Chosen name: <b>{nip05}</b>
              </Typography>
              <GetStartedButton onClick={handleClickAddAccount}>
                Create account {isLoading && <LoadingSpinner />}
              </GetStartedButton>

              <Typography textAlign={'left'} variant="h5" paddingTop="1em">
                What you need to know:
              </Typography>

              <ol style={{ marginLeft: '1em' }}>
                <li>Nostr accounts are based on cryptographic keys.</li>
                <li>All your actions on Nostr will be signed by your keys.</li>
                <li>Nsec.app is one of many services to manage Nostr keys.</li>
                <li>When you create an account, a new key will be created.</li>
                <li>This key can later be used with other Nostr websites.</li>
              </ol>
              <LearnMoreButton onClick={handleLearnMore}>Learn more</LearnMoreButton>
            </Stack>
          </>
        )}
      </Stack>
      <ModalConfirmConnect />
    </>
  )
}

export default CreatePage
