import { FC, FormEvent, useEffect, useState } from 'react'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { getActionName, getUsablePermList } from '@/utils/helpers/helpers'
import { FilterOptionsState, MenuItem, SelectChangeEvent, Stack, createFilterOptions } from '@mui/material'
import { Button } from '@/shared/Button/Button'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { useAppSelector } from '@/store/hooks/redux'
import { selectApps } from '@/store'
import { useParams } from 'react-router-dom'
import { swicCall } from '@/modules/swic'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { KINDS } from '@/utils/consts'
import { StyledAutocomplete, StyledPlaceholder, StyledSelect } from './styled'
import { isNotANumber } from './utils'

export interface KindOptionType {
  inputValue?: string
  kind?: number
  name?: string
}

const filter = createFilterOptions<KindOptionType>()

export const ModalAddPermission: FC = () => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.ADD_PERMISSION)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.ADD_PERMISSION)

  const { npub = '', appNpub = '' } = useParams()
  const apps = useAppSelector(selectApps)
  const notify = useEnqueueSnackbar()

  const [type, setType] = useState('')
  const [param, setParam] = useState<KindOptionType | null>(null)

  const [isLoading, setIsLoading] = useState(false)

  const permOptions = getUsablePermList()
  const isSignEvent = type === 'sign_event'

  const handleSelectType = (e: SelectChangeEvent<string>) => {
    const type = e.target.value
    setType(e.target.value)
    if (type !== 'sign_event') setParam(null)
  }

  const resetStates = () => {
    setType('')
    setParam(null)
    setIsLoading(false)
  }

  const isFormValid = isSignEvent ? !!type && !!param : !!type

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!isFormValid) throw new Error('Please fill out all fields!')
    setIsLoading(true)
    try {
      const permission = isSignEvent ? `${type}:${param?.kind}` : type
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

  const handleSelectKind = (e: any, newValue: string | KindOptionType | null) => {
    if (typeof newValue === 'string') {
      if (isNotANumber(newValue)) return
      return setParam({
        name: newValue,
        kind: Number(newValue),
        inputValue: newValue,
      })
    }
    if (newValue && newValue.inputValue) {
      // Create a new value from the user input
      return setParam({
        name: newValue.inputValue,
        kind: newValue.kind,
        inputValue: newValue.inputValue,
      })
    }
    setParam(newValue)
  }

  const handleFilterOptions = (options: KindOptionType[], params: FilterOptionsState<KindOptionType>) => {
    const filtered = filter(options, params)
    const { inputValue } = params
    // Suggest the creation of a new value
    const isExisting = options.some((option) => inputValue === option.name)
    if (inputValue !== '' && !isExisting && !isNotANumber(inputValue)) {
      filtered.push({
        inputValue,
        name: `Add "${inputValue}"`,
        kind: Number(inputValue),
      })
    }
    return filtered
  }

  const getOptionLabel = (option: string | KindOptionType) => {
    // Value selected with enter, right from the input
    if (typeof option === 'string') return option
    // Add "xxx" option created dynamically
    if (option.inputValue) return option.name as string
    // Regular option
    return `${option.kind} - ${option.name as string}`
  }

  return (
    <Modal open={isModalOpened} onClose={handleCloseModal} title="Add a permission" fixedHeight="50%">
      <Stack minHeight={'40%'} component={'form'} onSubmit={handleSubmit} gap={'1.5rem'}>
        <Stack gap={'1rem'}>
          <StyledSelect onChange={handleSelectType} value={type} renderValue={renderTypeValue} label="Type">
            {permOptions.map((permOption) => (
              <MenuItem value={permOption} key={permOption}>
                {getActionName(permOption)}
              </MenuItem>
            ))}
          </StyledSelect>

          {isSignEvent && (
            <StyledAutocomplete
              value={param}
              onChange={handleSelectKind}
              filterOptions={handleFilterOptions}
              options={KINDS as KindOptionType[]}
              getOptionLabel={getOptionLabel}
            />
          )}
        </Stack>

        <Button type="submit" fullWidth disabled={!isFormValid || isLoading}>
          Add {isLoading && <LoadingSpinner />}
        </Button>
      </Stack>
    </Modal>
  )
}
