import { FC, FormEvent, useEffect, useState } from 'react'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { getActionName, getUsablePermList } from '@/utils/helpers/helpers'
import { MenuItem, SelectChangeEvent, Stack } from '@mui/material'
import { Button } from '@/shared/Button/Button'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { useAppSelector } from '@/store/hooks/redux'
import { selectApps } from '@/store'
import { useParams } from 'react-router-dom'
import { swicCall } from '@/modules/swic'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { KINDS } from '@/utils/consts'
import { StyledPlaceholder, StyledSelect } from './styled'

export const ModalAddPermission: FC = () => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.ADD_PERMISSION)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.ADD_PERMISSION)

  const { npub = '', appNpub = '' } = useParams()
  const apps = useAppSelector(selectApps)
  const notify = useEnqueueSnackbar()

  const [type, setType] = useState('')
  const [param, setParam] = useState<number | undefined>()

  const [isLoading, setIsLoading] = useState(false)

  const permOptions = getUsablePermList()
  const isSignEvent = type === 'sign_event'

  const handleSelectType = (e: SelectChangeEvent<string>) => {
    const type = e.target.value
    setType(e.target.value)
    if (type !== 'sign_event') setParam(undefined)
  }

  const handleSelectParam = (e: SelectChangeEvent<number>) => {
    setParam(e.target.value as number)
  }

  const resetStates = () => {
    setType('')
    setParam(undefined)
    setIsLoading(false)
  }

  const isFormValid = isSignEvent ? !!type && param !== undefined : !!type

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isFormValid) throw new Error('Please fill out all fields!')
    setIsLoading(true)
    try {
      const permission = isSignEvent ? `${type}:${param}` : type
      await swicCall('addPerm', appNpub, npub, permission)
      setIsLoading(false)
      notify('Permission successfully added!', 'success')
      resetStates()
      handleCloseModal()
    } catch (error: any) {
      notify(error?.message || 'Failed to add a permission', 'error')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (isModalOpened) resetStates() // modal closed
    }
  }, [isModalOpened])

  const isAppNpubExists = appNpub.trim().length && apps.some((app) => app.appNpub === appNpub && app.npub === npub)

  if (isModalOpened && !isAppNpubExists) {
    handleCloseModal()
    return null
  }

  const renderTypeValue = (value: string) => {
    if (!value) return <StyledPlaceholder>Select a permission type</StyledPlaceholder>
    return getActionName(value)
  }

  const renderParamValue = (value: number) => {
    if (value === undefined) return <StyledPlaceholder>Select an additional param</StyledPlaceholder>
    return KINDS[value].name
  }

  return (
    <Modal open={isModalOpened} onClose={handleCloseModal} title="Add a permission" fixedHeight="50%">
      <Stack gap={'1rem'} minHeight={'40%'} component={'form'} onSubmit={handleSubmit}>
        <StyledSelect onChange={handleSelectType} value={type} renderValue={renderTypeValue} label="Type">
          {permOptions.map((permOption) => (
            <MenuItem value={permOption}>{getActionName(permOption)}</MenuItem>
          ))}
        </StyledSelect>

        {isSignEvent && (
          <StyledSelect
            onChange={handleSelectParam}
            value={param}
            renderValue={renderParamValue}
            label="Additional param"
          >
            {Object.keys(KINDS).map((key) => (
              <MenuItem value={KINDS[key].kind}>{KINDS[key].name}</MenuItem>
            ))}
          </StyledSelect>
        )}

        <Button type="submit" fullWidth sx={{ marginTop: '1rem' }} disabled={!isFormValid || isLoading}>
          Add {isLoading && <LoadingSpinner />}
        </Button>
      </Stack>
    </Modal>
  )
}
