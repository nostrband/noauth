import { FC, useCallback, useEffect } from 'react'
import { generateNip05 } from '@/utils/helpers/helpers'
import { client } from '@/modules/client'
import { useSearchParams } from 'react-router-dom'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Stack } from '@mui/material'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'

export const ModalSigningUpContent: FC = () => {
  const { createHandleCloseReplace } = useModalSearchParams()
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.SIGNING_UP)

  const notify = useEnqueueSnackbar()
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email')
  const pubkey = searchParams.get('email')

  const handleGenerateKeyConnect = useCallback(async () => {
    try {
      if (!email || !pubkey) {
        notify('Something went wrong!', 'error')
        handleCloseModal()
        return
      }
      const name = await generateNip05()
      console.log({ name }, 'HISH')
      const key = await client.generateKeyForEmail(name, email)
      console.log({ key }, 'HISH')
      const nostrconnect = `nostrconnect://${pubkey}`
      const requestId = await client.nostrConnect(key.npub, nostrconnect, {})
      console.log({ requestId }, 'HISH')
      console.log('requestId', { requestId })
      // window.close()
      handleCloseModal()
    } catch (error: any) {
      notify('Error: ' + error.toString(), 'error')
      handleCloseModal()
    }
  }, [email, pubkey, handleCloseModal, notify])

  useEffect(() => {
    handleGenerateKeyConnect()
  }, [handleGenerateKeyConnect])

  return (
    <Stack height={'150px'} alignItems={'center'} justifyContent={'center'}>
      <LoadingSpinner size={40} mode="secondary" />
    </Stack>
  )
}
