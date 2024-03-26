import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { DbConnectToken } from '@/modules/db'
import { swicCall } from '@/modules/swic'
import { AppLink } from '@/shared/AppLink/AppLink'
import { Button } from '@/shared/Button/Button'
import { Input } from '@/shared/Input/Input'
import { InputCopyButton } from '@/shared/InputCopyButton/InputCopyButton'
import { Modal } from '@/shared/Modal/Modal'
import { selectKeys } from '@/store'
import { useAppSelector } from '@/store/hooks/redux'
import { EXPLANATION_MODAL_KEYS, MODAL_PARAMS_KEYS } from '@/types/modal'
import { getBunkerLink } from '@/utils/helpers/helpers'
import { Stack, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'

export const ModalConnectApp = () => {
  const keys = useAppSelector(selectKeys)

  const timerRef = useRef<NodeJS.Timeout>()
  const notify = useEnqueueSnackbar()
  const { npub = '' } = useParams<{ npub: string }>()

  const [token, setToken] = useState<DbConnectToken | undefined>()

  const { getModalOpened, createHandleCloseReplace, handleOpen } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.CONNECT_APP)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.CONNECT_APP, {
    onClose: () => {
      clearTimeout(timerRef.current)
    },
  })

  const isNpubExists = npub.trim().length && keys.some((key) => key.npub === npub)

  useEffect(() => {
    const load = async () => {
      if (isModalOpened && isNpubExists && (!token || token.expiry < Date.now())) {
        const t = await swicCall('getConnectToken', npub) as DbConnectToken
        setToken(t)
      }
    }
    load()
  }, [npub, token, isModalOpened, isNpubExists])

  if (isModalOpened && !isNpubExists) {
    handleCloseModal()
    return null
  }

  const bunkerStr = getBunkerLink(npub, token?.token)

  const handleShareBunker = async () => {
    const shareData = {
      text: bunkerStr,
    }
    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        navigator.clipboard.writeText(bunkerStr)
      }
    } catch (err) {
      console.log(err)
      notify('Your browser does not support sharing data', 'warning')
    }
  }

  const handleCopy = () => {
    timerRef.current = setTimeout(() => {
      handleCloseModal()
    }, 3000)
  }

  return (
    <Modal open={isModalOpened} title="Connect App" onClose={handleCloseModal}>
      <Stack gap={'1rem'} alignItems={'center'}>
        <Typography variant="body2">Please, copy this string and paste it into the app to log in.</Typography>
        <Typography variant="body2" color={'red'}>Do not share it publicly!</Typography>
        <Input
          sx={{
            gap: '0.5rem',
          }}
          fullWidth
          value={token ? bunkerStr : 'Loading...'}
          endAdornment={<InputCopyButton value={bunkerStr} onCopy={handleCopy} />}
        />
        <AppLink
          title="What is this?"
          onClick={() => handleOpen(MODAL_PARAMS_KEYS.EXPLANATION, { search: { type: EXPLANATION_MODAL_KEYS.BUNKER } })}
        />
        <Button fullWidth onClick={handleShareBunker}>
          Send
        </Button>
      </Stack>
    </Modal>
  )
}
