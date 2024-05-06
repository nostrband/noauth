import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { DbConnectToken } from '@/modules/common/db-types'
import { AppLink } from '@/shared/AppLink/AppLink'
import { Button } from '@/shared/Button/Button'
import { Input } from '@/shared/Input/Input'
import { InputCopyButton } from '@/shared/InputCopyButton/InputCopyButton'
import { Modal } from '@/shared/Modal/Modal'
import { selectKeys } from '@/store'
import { useAppSelector } from '@/store/hooks/redux'
import { EXPLANATION_MODAL_KEYS, MODAL_PARAMS_KEYS } from '@/types/modal'
import { Box, Fade, FilterOptionsState, MenuItem, Stack, Typography, createFilterOptions } from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { StyledAdvancedButton, StyledAutocomplete } from './styled'
import { nip19 } from 'nostr-tools'
import { usePrepareSubNpubList } from '@/hooks/usePrepareSubNpubList'
import { SubNpubMenuItem } from './components/SubNpubMenuItem'
import { NIP46_RELAYS } from '@/utils/consts'
import { client } from '@/modules/swic'

export interface SubNpubOptionType {
  inputValue?: string
  subNpub?: string
}

const filter = createFilterOptions<SubNpubOptionType>()

const getBunkerLink = (npub: string, token = '') => {
  const { data: pubkey } = nip19.decode(npub)
  return `bunker://${pubkey}?relay=${NIP46_RELAYS[0]}${token ? `&secret=${token}` : ''}`
}

export const ModalConnectApp = () => {
  const keys = useAppSelector(selectKeys)

  const timerRef = useRef<NodeJS.Timeout>()
  const notify = useEnqueueSnackbar()
  const { npub = '' } = useParams<{ npub: string }>()

  const { getModalOpened, createHandleCloseReplace, handleOpen } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.CONNECT_APP)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.CONNECT_APP, {
    onClose: () => {
      clearTimeout(timerRef.current)
    },
  })

  const [token, setToken] = useState<DbConnectToken | undefined>()

  const [subNpubOption, setSubNpubOption] = useState<SubNpubOptionType | null>(null)
  const { subNpub = '' } = subNpubOption || {}

  const subNpubs = usePrepareSubNpubList(npub)

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  const isNpubExists = npub.trim().length && keys.some((key) => key.npub === npub)

  const loadConnectTokenOnMount = async () => {
    const validToken = !!token && token.expiry > Date.now()
    if (validToken) return
    const t = await client.getConnectToken(npub)
    setToken(t)
  }

  const getConnectToken = useCallback(async () => {
    const isValidSubNpub = subNpub !== npub
    if (!isValidSubNpub) return
    const t = await client.getConnectToken(npub, subNpub)
    setToken(t)
  }, [npub, subNpub])

  useEffect(() => {
    if (isModalOpened && isNpubExists) loadConnectTokenOnMount()
    // eslint-disable-next-line
  }, [isModalOpened])

  useEffect(() => {
    if (isModalOpened && isNpubExists) getConnectToken()
    // eslint-disable-next-line
  }, [isModalOpened, getConnectToken])

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

  const handleToggleShowAdvancedOptions = () => setShowAdvancedOptions((prevShow) => !prevShow)

  const handleSelectKind = (e: any, newValue: string | SubNpubOptionType | null) => {
    if (typeof newValue === 'string') {
      return setSubNpubOption({
        subNpub: newValue,
        inputValue: newValue,
      })
    }
    if (newValue && newValue.inputValue) {
      // Create a new value from the user input
      return setSubNpubOption({
        subNpub: newValue.inputValue,
        inputValue: newValue.inputValue,
      })
    }
    setSubNpubOption(newValue)
  }

  const validateSubNpub = useCallback((npub: string) => {
    try {
      if (!npub.startsWith('npub')) return false
      const { type } = nip19.decode(npub)
      return type === 'npub'
    } catch (error) {
      return false
    }
  }, [])

  const handleFilterOptions = (options: SubNpubOptionType[], params: FilterOptionsState<SubNpubOptionType>) => {
    const filtered = filter(options, params)
    const { inputValue } = params
    // Suggest the creation of a new value
    const isValidNpub = validateSubNpub(inputValue)

    if (!isValidNpub) return filtered

    const isExisting = options.some((option) => inputValue === option.subNpub)
    if (inputValue !== '' && !isExisting) {
      filtered.push({
        inputValue,
        subNpub: `Enter "${inputValue}"`,
      })
    }
    return filtered
  }

  const getOptionLabel = (option: string | SubNpubOptionType) => {
    // Value selected with enter, right from the input
    if (typeof option === 'string') return option
    // Add "xxx" option created dynamically
    if (option.inputValue) return option.subNpub as string
    // Regular option
    return option.subNpub as string
  }

  if (isModalOpened && !isNpubExists) {
    handleCloseModal()
    return null
  }

  return (
    <Modal open={isModalOpened} title="Connect App" onClose={handleCloseModal}>
      <Stack gap={'1rem'} alignItems={'center'}>
        <StyledAdvancedButton onClick={handleToggleShowAdvancedOptions}>Advanced options</StyledAdvancedButton>

        <Fade in={showAdvancedOptions} unmountOnExit={true}>
          <Box width={'100%'} marginBottom={'0.5rem'}>
            <StyledAutocomplete
              value={subNpubOption}
              onChange={handleSelectKind}
              filterOptions={handleFilterOptions}
              options={subNpubs as SubNpubOptionType[]}
              getOptionLabel={getOptionLabel}
              renderOption={(props, option) => {
                if (option.inputValue) return <MenuItem {...props}>{option.subNpub}</MenuItem>
                return <SubNpubMenuItem {...props} option={option} />
              }}
            />
          </Box>
        </Fade>

        <Stack gap={'0.5rem'} alignItems={'center'} width={'100%'}>
          <Input
            label="Connection string"
            sx={{
              gap: '0.5rem',
            }}
            fullWidth
            value={token ? bunkerStr : 'Loading...'}
            endAdornment={<InputCopyButton value={bunkerStr} onCopy={handleCopy} />}
          />

          <Stack
            direction={'row'}
            alignItems={'center'}
            justifyContent={'space-between'}
            marginBottom={'0.5rem'}
            padding={'0 1rem'}
            width={'100%'}
          >
            <Typography variant="body2" color={'GrayText'}>
              Paste it into an app.
            </Typography>
            <AppLink
              title="What is this?"
              onClick={() =>
                handleOpen(MODAL_PARAMS_KEYS.EXPLANATION, { search: { type: EXPLANATION_MODAL_KEYS.BUNKER } })
              }
            />
          </Stack>
        </Stack>

        <Button fullWidth onClick={handleShareBunker}>
          Send
        </Button>
      </Stack>
    </Modal>
  )
}
