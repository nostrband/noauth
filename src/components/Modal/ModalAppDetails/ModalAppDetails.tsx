import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Button } from '@/shared/Button/Button'
import { Input } from '@/shared/Input/Input'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Autocomplete, FilterOptionsState, MenuItem, Stack, Typography, createFilterOptions } from '@mui/material'
import { StyledAutocomplete, StyledInput } from './styled'
import { FormEvent, useCallback, useEffect, useState } from 'react'
import { isEmptyString } from '@/utils/helpers/helpers'
import { useParams } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks/redux'
import { selectApps } from '@/store'
import { DbApp } from '@/modules/common/db-types'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { InputCopyButton } from '@/shared/InputCopyButton/InputCopyButton'
import { nip19 } from 'nostr-tools'
import { usePrepareSubNpubList } from '@/hooks/usePrepareSubNpubList'
import { SubNpubMenuItem } from './components/SubNpubMenuItem'
import { client } from '@/modules/swic'

export interface SubNpubOptionType {
  inputValue?: string
  subNpub?: string
}

const filter = createFilterOptions<SubNpubOptionType>()

export const ModalAppDetails = () => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.APP_DETAILS)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.APP_DETAILS)
  const notify = useEnqueueSnackbar()

  const { npub = '', appNpub = '' } = useParams()
  const apps = useAppSelector(selectApps)
  const currentApp = apps.find((app) => app.appNpub === appNpub && app.npub === npub)
  const subNpubs = usePrepareSubNpubList(npub)

  const [details, setDetails] = useState({
    url: '',
    name: '',
    icon: '',
  })
  const [subNpubOption, setSubNpubOption] = useState<SubNpubOptionType | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const isAppNpubExists = appNpub.trim().length && apps.some((app) => app.appNpub === appNpub)

  const { userAgent } = currentApp || {}
  const { icon, name, url } = details
  const { subNpub = '' } = subNpubOption || {}
  const subNpubEntered = subNpub.trim().length > 0
  const isFormValid = subNpubEntered || true

  useEffect(() => {
    if (!currentApp) return

    setDetails({
      icon: currentApp.icon || '',
      name: currentApp.name || '',
      url: currentApp.url || '',
    })

    if (currentApp.subNpub) {
      setSubNpubOption({
        subNpub: currentApp.subNpub,
      })
    }

    // eslint-disable-next-line
  }, [appNpub, isModalOpened])

  useEffect(() => {
    return () => {
      if (isModalOpened) {
        // modal closed
        setIsLoading(false)
      }
    }
  }, [isModalOpened])

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
      await client.call('updateApp', updatedApp)
      notify(`App successfully updated!`, 'success')
      setIsLoading(false)
      handleCloseModal()
    } catch (error: any) {
      setIsLoading(false)
      notify(error?.message || 'Something went wrong!', 'error')
    }
  }

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

  if (isModalOpened && !isAppNpubExists) {
    handleCloseModal()
    return null
  }

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

        <Button type="submit" fullWidth disabled={!isFormValid || isLoading}>
          Save changes {isLoading && <LoadingSpinner mode="secondary" />}
        </Button>
      </Stack>
    </Modal>
  )
}
