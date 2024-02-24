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
import { fetchNip05, isValidUserName } from '@/utils/helpers/helpers'
import { Stack, Typography, useTheme } from '@mui/material'
import { ChangeEvent, Fragment, useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useDebounce } from 'use-debounce'
import { StyledSettingContainer } from './styled'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'

export const ModalEditName = () => {
  const keys = useAppSelector(selectKeys)
  const notify = useEnqueueSnackbar()
  const { npub = '' } = useParams<{ npub: string }>()

  const key = keys.find((k) => k.npub === npub)
  const name = key?.name || ''

  const { palette } = useTheme()

  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.EDIT_NAME)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.EDIT_NAME)

  const [enteredName, setEnteredName] = useState('')
  const [debouncedName] = useDebounce(enteredName, 300)
  const isNameEqual = debouncedName === name

  const [receiverNpub, setReceiverNpub] = useState('')

  const [isAvailable, setIsAvailable] = useState(true)
  const [isChecking, setIsChecking] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [isTransferLoading, setIsTransferLoading] = useState(false)

  const isValidName = isValidUserName(debouncedName)

  const checkIsUsernameAvailable = useCallback(async () => {
    if (!isValidName) return undefined
    try {
      setIsChecking(true)
      const npubNip05 = await fetchNip05(`${debouncedName}@${DOMAIN}`)
      setIsAvailable(!npubNip05 || npubNip05 === npub)
      setIsChecking(false)
    } catch (error) {
      setIsAvailable(true)
      setIsChecking(false)
    }
  }, [debouncedName, npub])

  useEffect(() => {
    checkIsUsernameAvailable()
  }, [checkIsUsernameAvailable])

  useEffect(() => {
    setEnteredName(name)
    return () => {
      if (isModalOpened) {
        setEnteredName('')
        setReceiverNpub('')
      }
    }
    // eslint-disable-next-line
  }, [isModalOpened])

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => setEnteredName(e.target.value)

  const handleReceiverNpubChange = (e: ChangeEvent<HTMLInputElement>) => setReceiverNpub(e.target.value)

  const getInputHelperText = () => {
    if (!debouncedName.trim().length || isNameEqual) return ''
    if (isChecking) return 'Loading...'
    if (!isAvailable) return 'Already taken'
    if (!isValidName) return 'Invalid name'
    return (
      <Fragment>
        <CheckmarkIcon /> Available
      </Fragment>
    )
  }
  const inputHelperText = getInputHelperText()

  const getHelperTextColor = useCallback(() => {
    if (!debouncedName || isChecking || isNameEqual) return palette.textSecondaryDecorate.main
    return isAvailable && isValidName ? palette.success.main : palette.error.main
    // deps
  }, [debouncedName, isAvailable, isChecking, isNameEqual, palette])

  const isNpubExists = npub.trim().length && keys.some((key) => key.npub === npub)
  if (isModalOpened && !isNpubExists) {
    handleCloseModal()
    return null
  }

  const isEditButtonDisabled = isNameEqual || !isAvailable || isChecking || isLoading || !enteredName.trim().length
  const isTransferButtonDisabled = !name.length || !receiverNpub.trim().length || isTransferLoading

  const handleEditName = async () => {
    if (isEditButtonDisabled) return
    try {
      setIsLoading(true)
      await swicCall('editName', npub, enteredName)
      notify('Username updated!', 'success')
      setIsLoading(false)
    } catch (error: any) {
      setIsLoading(false)
      notify(error?.message || 'Failed to edit username!', 'error')
    }
  }

  const handleTransferName = async () => {
    if (isTransferButtonDisabled) return
    try {
      setIsTransferLoading(true)
      await swicCall('transferName', npub, enteredName, receiverNpub)
      notify('Username transferred!', 'success')
      setIsTransferLoading(false)
      setEnteredName('')
    } catch (error: any) {
      setIsTransferLoading(false)
      notify(error?.message || 'Failed to transfer username!', 'error')
    }
  }

  return (
    <Modal open={isModalOpened} title="Username Settings" onClose={handleCloseModal}>
      <Stack gap={'1rem'}>
        <StyledSettingContainer>
          <SectionTitle>Change name</SectionTitle>
          <Input
            label="User name"
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
            Save name {isLoading && <LoadingSpinner />}
          </Button>
        </StyledSettingContainer>
        <StyledSettingContainer>
          <SectionTitle>Transfer name</SectionTitle>
          <Input
            label="Receiver npub"
            fullWidth
            placeholder="npub1..."
            onChange={handleReceiverNpubChange}
            value={receiverNpub}
          />
          <Button fullWidth onClick={handleTransferName} disabled={isTransferButtonDisabled}>
            Transfer name
          </Button>
        </StyledSettingContainer>
      </Stack>
    </Modal>
  )
}
