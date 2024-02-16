import { CheckmarkIcon } from '@/assets'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { swicCall } from '@/modules/swic'
import { Button } from '@/shared/Button/Button'
import { Input } from '@/shared/Input/Input'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { Modal } from '@/shared/Modal/Modal'
import { selectKeys } from '@/store'
import { useAppSelector } from '@/store/hooks/redux'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { DOMAIN } from '@/utils/consts'
import { fetchNip05 } from '@/utils/helpers/helpers'
import { Stack, Typography, useTheme } from '@mui/material'
import { ChangeEvent, Fragment, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useDebounce } from 'use-debounce'

export const ModalEditName = () => {
  const keys = useAppSelector(selectKeys)
  const notify = useEnqueueSnackbar()

  const [searchParams] = useSearchParams()
  const name = searchParams.get('name') || ''
  const npub = searchParams.get('npub') || ''

  const { palette } = useTheme()

  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.EDIT_NAME)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.EDIT_NAME)

  const [enteredName, setEnteredName] = useState('')
  const [debouncedName] = useDebounce(enteredName, 300)
  const isNameEqual = debouncedName === name

  const [isAvailable, setIsAvailable] = useState(true)
  const [isChecking, setIsChecking] = useState(false)

  const [isLoading, setIsLoading] = useState(false)

  const checkIsUsernameAvailable = useCallback(async () => {
    if (!debouncedName.trim().length) return undefined
    try {
      setIsChecking(true)
      const npubNip05 = await fetchNip05(`${debouncedName}@${DOMAIN}`)
      setIsAvailable(!npubNip05)
      setIsChecking(false)
    } catch (error) {
      setIsAvailable(true)
      setIsChecking(false)
    }
  }, [debouncedName])

  useEffect(() => {
    checkIsUsernameAvailable()
  }, [checkIsUsernameAvailable])

  useEffect(() => {
    setEnteredName(name)
    return () => {
      if (isModalOpened) setEnteredName('')
    }
    // eslint-disable-next-line
  }, [isModalOpened])

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => setEnteredName(e.target.value)

  const getInputHelperText = () => {
    if (!debouncedName.trim().length || isNameEqual) return ''
    if (isChecking) return 'Loading...'
    if (!isAvailable) return 'Already taken'
    return (
      <Fragment>
        <CheckmarkIcon /> Available
      </Fragment>
    )
  }
  const inputHelperText = getInputHelperText()

  const getHelperTextColor = useCallback(() => {
    if (!debouncedName || isChecking || isNameEqual) return palette.textSecondaryDecorate.main
    return isAvailable ? palette.success.main : palette.error.main
    // deps
  }, [debouncedName, isAvailable, isChecking, isNameEqual, palette])

  const isNpubExists = npub.trim().length && keys.some((key) => key.npub === npub)
  if (isModalOpened && !isNpubExists) {
    handleCloseModal()
    return null
  }

  const isEditButtonDisabled = isNameEqual || isChecking || isLoading || !enteredName.trim().length

  const handleEditName = async () => {
    try {
      setIsLoading(true)
      await swicCall('editName', npub, debouncedName)
      notify('Username successfully editted!', 'success')
      setEnteredName(debouncedName)
      setIsLoading(false)
    } catch (error) {
      setIsLoading(false)
    }
  }

  return (
    <Modal open={isModalOpened} title="Edit username" onClose={handleCloseModal}>
      <Stack gap={'1rem'}>
        <Stack gap={'1rem'}>
          <Input
            label="Username"
            fullWidth
            placeholder="Enter a Username"
            endAdornment={<Typography color={'#FFFFFFA8'}>@{DOMAIN}</Typography>}
            helperText={inputHelperText}
            onChange={handleNameChange}
            value={enteredName}
            helperTextProps={{
              sx: {
                '&.helper_text': {
                  color: getHelperTextColor(),
                },
              },
            }}
          />
          <Button fullWidth disabled={isEditButtonDisabled} onClick={handleEditName}>
            Edit name {isLoading && <LoadingSpinner />}
          </Button>
        </Stack>
        <Stack gap={'1rem'}>
          <Input label="Receiver npub" fullWidth placeholder="npub1..." />
          <Button fullWidth>Transfer name</Button>
        </Stack>
      </Stack>
    </Modal>
  )
}
