import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Button } from '@/shared/Button/Button'
import { Input } from '@/shared/Input/Input'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Autocomplete, Stack, Typography } from '@mui/material'
import { StyledInput } from './styled'
import { FormEvent, useEffect, useState } from 'react'
import { isEmptyString } from '@/utils/helpers/helpers'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks/redux'
import { selectApps } from '@/store'
import { dbi } from '@/modules/db'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { setApps } from '@/store/reducers/content.slice'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'

export const ModalAppDetails = () => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.APP_DETAILS)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.APP_DETAILS)

  const { appNpub = '' } = useParams()
  const apps = useAppSelector(selectApps)
  const dispatch = useAppDispatch()

  const notify = useEnqueueSnackbar()

  const [details, setDetails] = useState({
    url: '',
    name: '',
    icon: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const currentApp = apps.find((app) => app.appNpub === appNpub)
    if (!currentApp) return

    setDetails({
      icon: currentApp.icon || '',
      name: currentApp.name || '',
      url: currentApp.url || '',
    })

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

  const isAppNpubExists = appNpub.trim().length && apps.some((app) => app.appNpub === appNpub)

  if (isModalOpened && !isAppNpubExists) {
    handleCloseModal()
    return null
  }

  const { icon, name, url } = details

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
    if (isLoading) return undefined
    try {
      setIsLoading(true)
      const updatedApp = {
        url,
        name,
        icon,
        appNpub,
      }
      await dbi.updateApp(updatedApp)
      const apps = await dbi.listApps()
      dispatch(
        setApps({
          apps,
        })
      )
      notify(`App successfully updated!`, 'success')
      setIsLoading(false)
      handleCloseModal()
    } catch (error: any) {
      setIsLoading(false)
      notify(error?.message || 'Something went wrong!', 'error')
    }
  }

  const isFormValid = !isEmptyString(url) && !isEmptyString(name)

  return (
    <Modal open={isModalOpened} onClose={handleCloseModal}>
      <Stack gap={'1rem'} component={'form'} onSubmit={submitHandler}>
        <Stack alignItems={'center'}>
          <Typography fontWeight={600} variant="h5">
            App details
          </Typography>
        </Stack>

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
          label="Name"
          fullWidth
          placeholder="Enter app name"
          onChange={handleInputChange('name')}
          value={details.name}
        />
        <Input
          label="Icon"
          fullWidth
          placeholder="Enter app icon url"
          onChange={handleInputChange('icon')}
          value={details.icon}
        />

        <Button varianttype="secondary" type="submit" fullWidth disabled={!isFormValid || isLoading}>
          Save changes {isLoading && <LoadingSpinner />}
        </Button>
      </Stack>
    </Modal>
  )
}
