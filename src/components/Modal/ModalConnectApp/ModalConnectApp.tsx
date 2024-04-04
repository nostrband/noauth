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
import { Box, Fade, Stack, Typography, useTheme } from '@mui/material'
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { StyledAdvancedButton } from './styled'
import { useDebounce } from 'use-debounce'
import { nip19 } from 'nostr-tools'

export const ModalConnectApp = () => {
  const keys = useAppSelector(selectKeys)

  const timerRef = useRef<NodeJS.Timeout>()
  const notify = useEnqueueSnackbar()
  const { npub = '' } = useParams<{ npub: string }>()
  const theme = useTheme()

  const { getModalOpened, createHandleCloseReplace, handleOpen } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.CONNECT_APP)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.CONNECT_APP, {
    onClose: () => {
      clearTimeout(timerRef.current)
    },
  })

  const [token, setToken] = useState<DbConnectToken | undefined>()

  const [subNpub, setSubNpub] = useState('')
  const [debouncedSubNpub] = useDebounce(subNpub, 500)
  const [isSubNpubValid, setIsSubNpubValid] = useState(false)
  const subNpubEntered = subNpub.trim().length > 0

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  const isNpubExists = npub.trim().length && keys.some((key) => key.npub === npub)

  const loadConnectTokenOnMount = async () => {
    const validToken = !!token && token.expiry > Date.now()
    if (validToken) return
    const t = (await swicCall('getConnectToken', npub)) as DbConnectToken
    setToken(t)
  }

  const getConnectToken = useCallback(async () => {
    const isValidSubNpub = subNpubEntered && isSubNpubValid && debouncedSubNpub !== npub

    if (!isValidSubNpub) {
      const t = (await swicCall('getConnectToken', npub)) as DbConnectToken
      return setToken(t)
    }
    const t = (await swicCall('getConnectToken', npub, debouncedSubNpub)) as DbConnectToken

    setToken(t)
  }, [isSubNpubValid, subNpubEntered, npub, debouncedSubNpub])

  useEffect(() => {
    if (isModalOpened && isNpubExists) loadConnectTokenOnMount()
    // eslint-disable-next-line
  }, [isModalOpened])

  useEffect(() => {
    if (isModalOpened && isNpubExists) getConnectToken()
    // eslint-disable-next-line
  }, [isModalOpened, getConnectToken])

  const validateSubNpub = useCallback(async () => {
    if (!debouncedSubNpub.trim().length) return
    try {
      const { type } = nip19.decode(debouncedSubNpub)
      if (type === 'npub') setIsSubNpubValid(true)
      else setIsSubNpubValid(false)
    } catch (error) {
      setIsSubNpubValid(false)
    }
  }, [debouncedSubNpub])

  useEffect(() => {
    validateSubNpub()
  }, [validateSubNpub])

  const bunkerStr = getBunkerLink(npub, token?.token)
  // console.log({ bunkerStr, token })

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

  const handleToggleShowAdvancedOptions = () => setShowAdvancedOptions((prevShow) => !prevShow)

  const handleSubNpubChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSubNpub(e.target.value)
  }

  if (isModalOpened && !isNpubExists) {
    handleCloseModal()
    return null
  }

  return (
    <Modal open={isModalOpened} title="Connect App" onClose={handleCloseModal}>
      <Stack gap={'1rem'} alignItems={'center'}>
        <Typography variant="body2">Copy this string and paste it into the app to log in.</Typography>
        <Typography variant="body2" color={'red'}>
          Do not share it publicly!
        </Typography>
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

        <StyledAdvancedButton onClick={handleToggleShowAdvancedOptions}>Advanced options</StyledAdvancedButton>

        <Fade in={showAdvancedOptions} unmountOnExit={true}>
          <Box width={'100%'} marginBottom={'0.5rem'}>
            <Input
              label="Shared access with"
              fullWidth
              placeholder="npub1..."
              value={subNpub}
              onChange={handleSubNpubChange}
              helperText={!isSubNpubValid && subNpubEntered && 'Invalid NPUB'}
              helperTextColor={theme.palette.error.main}
            />
          </Box>
        </Fade>

        <Button fullWidth onClick={handleShareBunker}>
          Send
        </Button>
      </Stack>
    </Modal>
  )
}
