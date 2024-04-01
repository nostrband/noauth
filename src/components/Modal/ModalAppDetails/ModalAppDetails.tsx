import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Button } from '@/shared/Button/Button'
import { Input } from '@/shared/Input/Input'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Autocomplete, Stack, Typography, useTheme } from '@mui/material'
import { StyledInput } from './styled'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { isEmptyString } from '@/utils/helpers/helpers'
import { useParams } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks/redux'
import { selectApps } from '@/store'
import { DbApp } from '@/modules/db'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { swicCall } from '@/modules/swic'
import { InputCopyButton } from '@/shared/InputCopyButton/InputCopyButton'
import { useDebounce } from 'use-debounce'
import { nip19 } from 'nostr-tools'

export const ModalAppDetails = () => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.APP_DETAILS)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.APP_DETAILS)
  const notify = useEnqueueSnackbar()
  const theme = useTheme()

  const { npub = '', appNpub = '' } = useParams()
  const apps = useAppSelector(selectApps)
  const currentApp = apps.find((app) => app.appNpub === appNpub && app.npub === npub)

  const [isLoading, setIsLoading] = useState(false)
  const [details, setDetails] = useState({
    url: '',
    name: '',
    icon: '',
    subNpub: '',
  })
  const [isValidNpub, setIsValidNpub] = useState(false)

  const isAppNpubExists = appNpub.trim().length && apps.some((app) => app.appNpub === appNpub)
  const { userAgent } = currentApp || {}

  const { icon, name, url, subNpub } = details
  const subNpubEntered = subNpub.trim().length > 0
//  const isFormValid = subNpubEntered ? !isEmptyString(name) && isValidNpub : !isEmptyString(name)
  const isFormValid = subNpubEntered ? isValidNpub : true

  const [debouncedSubNpub] = useDebounce(subNpub, 100)

  const validateSubNpub = useCallback(async () => {
    if (!debouncedSubNpub.trim().length) return
    try {
      const { type } = nip19.decode(debouncedSubNpub)
      if (type === 'npub') setIsValidNpub(true)
      else setIsValidNpub(false)
    } catch (error) {
      setIsValidNpub(false)
    }
  }, [debouncedSubNpub])

  useEffect(() => {
    validateSubNpub()
  }, [validateSubNpub])

  useEffect(() => {
    if (!currentApp) return

    setDetails({
      icon: currentApp.icon || '',
      name: currentApp.name || '',
      url: currentApp.url || '',
      subNpub: currentApp.subNpub || '',
    })

    // eslint-disable-next-line
  }, [appNpub, isModalOpened])

  useEffect(() => {
    return () => {
      if (isModalOpened) {
        // modal closed
        setIsLoading(false)
        setIsValidNpub(false)
      }
    }
  }, [isModalOpened])

  if (isModalOpened && !isAppNpubExists) {
    handleCloseModal()
    return null
  }

  const handleInputBlur = () => {
    if (isEmptyString(url)) return

    try {
      const u = new URL(url)

      if (isEmptyString(name)) setDetails((prev) => ({ ...prev, name: u.hostname }))
      if (isEmptyString(icon)) {
        const iconUrl = `https://${u.hostname}/favicon.ico`
        setDetails((prev) => ({ ...prev, icon: iconUrl }))
      }
    } catch {
      /* empty */
    }
  }

  const handleInputChange = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetails((prevState) => {
      return { ...prevState, [key]: e.target.value }
    })
  }

  const handleAutocompletInputChange = (e: unknown, value: string) => {
    setDetails((prevState) => {
      return { ...prevState, url: value }
    })
  }

  const submitHandler = async (e: FormEvent) => {
    e.preventDefault()
    if (isLoading || !currentApp) return undefined
    try {
      setIsLoading(true)

      const updatedApp: DbApp = {
        ...currentApp,
        url,
        name,
        icon,
        subNpub,
        updateTimestamp: Date.now(),
      }
      await swicCall('updateApp', updatedApp)
      notify(`App successfully updated!`, 'success')
      setIsLoading(false)
      handleCloseModal()
    } catch (error: any) {
      setIsLoading(false)
      notify(error?.message || 'Something went wrong!', 'error')
    }
  }

  return (
    <Modal open={isModalOpened} onClose={handleCloseModal}>
      <Stack alignItems={'center'}>
        <Typography fontWeight={600} variant="h5">
          App details
        </Typography>
      </Stack>
      <Stack gap={'0.75rem'} component={'form'} onSubmit={submitHandler} overflow={'auto'}>
        <Input
          label="NPUB"
          fullWidth
          defaultValue={appNpub}
          readOnly
          endAdornment={<InputCopyButton value={appNpub} />}
        />
        <Input
          label="User-agent"
          fullWidth
          defaultValue={userAgent}
          readOnly
          endAdornment={<InputCopyButton value={userAgent || ''} />}
        />
        <Input
          label="Shared access with"
          fullWidth
          placeholder="npub1..."
          value={subNpub}
          onChange={handleInputChange('subNpub')}
          helperText={!isValidNpub && subNpubEntered && 'Invalid NPUB'}
          helperTextColor={theme.palette.error.main}
        />

        <Input
          label="Name"
          fullWidth
          placeholder="Enter app name"
          onChange={handleInputChange('name')}
          value={details.name}
        />
        <Autocomplete
          options={[]}
          freeSolo
          onBlur={handleInputBlur}
          onInputChange={handleAutocompletInputChange}
          inputValue={details.url}
          renderInput={({ inputProps, disabled, id, InputProps }) => {
            return (
              <StyledInput
                {...InputProps}
                className="input"
                inputProps={inputProps}
                disabled={disabled}
                label="URL"
                fullWidth
                placeholder="Enter URL"
              />
            )
          }}
        />
        <Input
          label="Icon"
          fullWidth
          placeholder="Enter app icon url"
          onChange={handleInputChange('icon')}
          value={details.icon}
        />

        <Button varianttype="secondary" type="submit" fullWidth disabled={!isFormValid || isLoading}>
          Save changes {isLoading && <LoadingSpinner mode="secondary" />}
        </Button>
      </Stack>
    </Modal>
  )
}
