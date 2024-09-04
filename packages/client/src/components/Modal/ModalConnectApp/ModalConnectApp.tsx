import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { DbConnectToken } from '@noauth/common'
import { AppLink } from '@/shared/AppLink/AppLink'
import { Button } from '@/shared/Button/Button'
import { InputCopyButton } from '@/shared/InputCopyButton/InputCopyButton'
import { Modal } from '@/shared/Modal/Modal'
import { selectKeys } from '@/store'
import { useAppSelector } from '@/store/hooks/redux'
import { EXPLANATION_MODAL_KEYS, MODAL_PARAMS_KEYS } from '@/types/modal'
import { Box, Fade, FilterOptionsState, MenuItem, Stack } from '@mui/material'
import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  InputGroupContainer,
  InputDescriptionContainer,
  StyledAdvancedButton,
  StyledAutocomplete,
  StyledInput,
  StyledInputHelperText,
  StyledIconButton,
} from './styled'
import { nip19 } from 'nostr-tools'
import { usePrepareSubNpubList } from '@/hooks/usePrepareSubNpubList'
import { SubNpubMenuItem } from './components/SubNpubMenuItem'
import { client } from '@/modules/client'
import { SubNpubOptionType } from './utils/types'
import { filter, getBunkerLink } from './utils/helpers'
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGoRounded'
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScannerRounded'
import { ModalQrScanner } from '../ModalQrScanner/ModalQrScanner'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { parseMetadata } from '../ModalNostrConnect/utils/helpers'
import { Input } from '@/shared/Input/Input'
import ShareIcon from '@mui/icons-material/Share'

const NOSTR_CONNECT = 'nostrconnect://'

export const ModalConnectApp = () => {
  const keys = useAppSelector(selectKeys)
  const timerRef = useRef<NodeJS.Timeout>()
  const notify = useEnqueueSnackbar()
  const navigate = useNavigate()
  const { npub = '' } = useParams<{ npub: string }>()

  const [nostrconnect, setNostrconnect] = useState('')
  const [token, setToken] = useState<DbConnectToken | undefined>()
  const [subNpubOption, setSubNpubOption] = useState<SubNpubOptionType | null>(null)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { subNpub = '' } = subNpubOption || {}
  const subNpubs = usePrepareSubNpubList(npub)
  const isNpubExists = npub.trim().length && keys.some((key) => key.npub === npub)

  const { getModalOpened, createHandleCloseReplace, handleOpen } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.CONNECT_APP)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.CONNECT_APP, {
    onClose: () => {
      clearTimeout(timerRef.current)
      setShowAdvancedOptions(false)
      setShowQrScanner(false)
      setNostrconnect('')
    },
  })

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
  const shareData = useMemo(
    () => ({
      text: bunkerStr,
    }),
    [bunkerStr]
  )

  const canShare = useMemo(() => {
    if (!('navigator' in window)) return false
    return !!navigator.share && navigator.canShare(shareData)
  }, [shareData])

  const handleShareBunker = async () => {
    try {
      if (canShare) await navigator.share(shareData)
      else {
        navigator.clipboard.writeText(bunkerStr)
        notify('Copied to clipboard', 'success')
      }
    } catch (err: any) {
      if (err.toString().includes('AbortError')) return
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

  useEffect(() => {
    return () => {
      if (isModalOpened) handleCloseModal()
    }
    // eslint-disable-next-line
  }, [isModalOpened])

  if (isModalOpened && !isNpubExists) {
    handleCloseModal()
    return null
  }

  const handleOpenNostrConnectExplanation = () => {
    handleOpen(MODAL_PARAMS_KEYS.EXPLANATION, { search: { type: EXPLANATION_MODAL_KEYS.NOSTR_CONNECT } })
  }

  const handleOpenBunkerExplanation = () => {
    handleOpen(MODAL_PARAMS_KEYS.EXPLANATION, { search: { type: EXPLANATION_MODAL_KEYS.BUNKER } })
  }

  const handleOpenSharedNpubExplanation = () => {
    handleOpen(MODAL_PARAMS_KEYS.EXPLANATION, { search: { type: EXPLANATION_MODAL_KEYS.SHARED } })
  }

  const handlePasteNostrconnect = async () => {
    try {
      const text = await navigator.clipboard.readText()
      console.log(text)
      if (!text || !text.startsWith(NOSTR_CONNECT)) {
        return notify('Invalid nostrconnect', 'warning')
      }
      setNostrconnect(text)
    } catch (error) {
      notify('Failed to paste from clipboard', 'error')
    }
  }

  const handleToggleQrScanner = () => {
    setShowQrScanner((prevShow) => !prevShow)
  }

  const handleScanSuccess = (data: string) => {
    setNostrconnect(data)
    setShowQrScanner(false)
    notify('Successfully scanned', 'success')
  }

  const handleNostrConnectChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNostrconnect(e.target.value)
  }

  const isPopup = false

  const closePopup = () => {
    if (isPopup) return window.close()
  }

  const connect = async () => {
    if (!nostrconnect || !nostrconnect.startsWith(NOSTR_CONNECT)) {
      return notify('Invalid nostrconnect', 'warning')
    }
    setIsLoading(true)
    try {
      const searchParams = new URL(nostrconnect).searchParams
      const metadataJson = searchParams.get('metadata') || ''
      const metadata = parseMetadata(metadataJson) || {
        url: searchParams.get('url'),
        name: searchParams.get('name'),
        icon: searchParams.get('image'),
        perms: searchParams.get('perms'),
      }

      const { icon, name, url } = metadata || {}
      const appName = name || ''
      const appUrl = url || ''
      const appIcon = icon || ''

      const requestId = await client.nostrConnect(npub, nostrconnect, {
        appName,
        appUrl,
        appIcon,
        perms: metadata.perms || '',
      })
      setIsLoading(false)

      console.log('requestId', requestId)
      if (!requestId) {
        notify('App connected! Closing...', 'success')
        if (isPopup) setTimeout(() => closePopup(), 3000)
        else navigate(`/key/${npub}`, { replace: true })
      } else {
        return navigate(`/key/${npub}?confirm-connect=true&reqId=${requestId}&popup=true`)
      }
    } catch (e) {
      notify('Error: ' + e, 'error')
      setIsLoading(false)
    }
  }

  const handlePasteNpub = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (!text.startsWith('npub1')) return
      setSubNpubOption({
        subNpub: text,
        inputValue: text,
      })
    } catch (error) {
      notify('Failed to paste from clipboard', 'error')
    }
  }

  return (
    <>
      <Modal open={isModalOpened} title="Connect App" onClose={handleCloseModal}>
        <Stack gap={'0.5rem'}>
          <InputGroupContainer>
            <StyledInput
              label="Connection string"
              value={nostrconnect}
              onChange={handleNostrConnectChange}
              placeholder="nostrconnect://"
              endAdornment={
                <Stack direction={'row'} gap={'0.75rem'} alignItems={'center'}>
                  <StyledIconButton onClick={handlePasteNostrconnect}>
                    <ContentPasteGoIcon />
                  </StyledIconButton>
                  <StyledIconButton onClick={handleToggleQrScanner}>
                    <QrCodeScannerIcon />
                  </StyledIconButton>
                </Stack>
              }
            />

            <InputDescriptionContainer>
              <StyledInputHelperText>Paste nostrconnect: string</StyledInputHelperText>
              <AppLink title="What is this?" onClick={handleOpenNostrConnectExplanation} />
            </InputDescriptionContainer>
          </InputGroupContainer>

          <Button onClick={connect} disabled={isLoading}>
            Connect {isLoading && <LoadingSpinner />}
          </Button>

          <Box width={'100%'} marginTop={'1rem'} marginBottom={'0.5rem'}>
            <StyledAdvancedButton fullWidth={true} onClick={handleToggleShowAdvancedOptions}>
              Advanced options
            </StyledAdvancedButton>
          </Box>

          <Stack gap={'0.5rem'} alignItems={'center'} marginBottom={'0.5rem'}>
            <Fade in={showAdvancedOptions} unmountOnExit={true}>
              <Stack width={'100%'} gap={'0.75rem'}>
                <InputGroupContainer>
                  <StyledInput
                    label="Bunker URL"
                    value={token ? bunkerStr : 'Loading...'}
                    endAdornment={
                      <Stack direction={'row'} gap={'0.75rem'} alignItems={'center'}>
                        {canShare && (
                          <StyledIconButton onClick={handleShareBunker}>
                            <ShareIcon />
                          </StyledIconButton>
                        )}
                        <InputCopyButton value={bunkerStr} onCopy={handleCopy} />
                      </Stack>
                    }
                  />
                  <InputDescriptionContainer>
                    <StyledInputHelperText>Copy and paste it into an app.</StyledInputHelperText>
                    <AppLink title="What is this?" onClick={handleOpenBunkerExplanation} />
                  </InputDescriptionContainer>
                </InputGroupContainer>

                <InputGroupContainer width={'100%'} marginTop={'0.5rem'}>
                  <StyledAutocomplete
                    fullWidth
                    value={subNpubOption}
                    onChange={handleSelectKind}
                    filterOptions={handleFilterOptions}
                    options={subNpubs as SubNpubOptionType[]}
                    getOptionLabel={getOptionLabel}
                    renderOption={(props, option) => {
                      if (option.inputValue) return <MenuItem {...props}>{option.subNpub}</MenuItem>
                      return <SubNpubMenuItem {...props} option={option} />
                    }}
                    renderInput={({ inputProps, disabled, id, InputProps }) => {
                      return (
                        <Input
                          {...InputProps}
                          className="input"
                          inputProps={inputProps}
                          disabled={disabled}
                          label="Shared access with"
                          fullWidth
                          placeholder="npub1..."
                          endAdornment={
                            <StyledIconButton onClick={handlePasteNpub}>
                              <ContentPasteGoIcon />
                            </StyledIconButton>
                          }
                        />
                      )
                    }}
                  />
                  <InputDescriptionContainer>
                    <StyledInputHelperText>Set if sharing this bunker URL with someone</StyledInputHelperText>
                    <AppLink title="What is this?" onClick={handleOpenSharedNpubExplanation} />
                  </InputDescriptionContainer>
                </InputGroupContainer>
              </Stack>
            </Fade>
          </Stack>
        </Stack>
      </Modal>

      <ModalQrScanner open={showQrScanner} onClose={handleToggleQrScanner} onScanSuccess={handleScanSuccess} />
    </>
  )
}
