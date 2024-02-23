import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Box, Stack, Typography } from '@mui/material'
import { StyledButton, StyledSettingContainer, StyledSynchedText } from './styled'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { CheckmarkIcon } from '@/assets'
import { Input } from '@/shared/Input/Input'
import { ChangeEvent, FC, useEffect, useState } from 'react'
import { Checkbox } from '@/shared/Checkbox/Checkbox'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { swicCall } from '@/modules/swic'
import { useParams } from 'react-router-dom'
import { dbi } from '@/modules/db'
import { usePassword } from '@/hooks/usePassword'
import { useAppSelector } from '@/store/hooks/redux'
import { selectKeys } from '@/store'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { PasswordValidationStatus } from '@/shared/PasswordValidationStatus/PasswordValidationStatus'
import { usePasswordValidation } from '@/hooks/usePasswordValidation'
import { isValidPassphase } from '@/modules/keys'

type ModalSettingsProps = {
  isSynced: boolean
}

export const ModalSettings: FC<ModalSettingsProps> = ({ isSynced }) => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const { npub = '' } = useParams<{ npub: string }>()
  const keys = useAppSelector(selectKeys)

  const notify = useEnqueueSnackbar()

  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.SETTINGS)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.SETTINGS)

  const { hidePassword, inputProps } = usePassword()

  const [enteredPassword, setEnteredPassword] = useState('')
  const { isPasswordInvalid, passwordStrength, reset, setIsPasswordInvalid } = usePasswordValidation(enteredPassword)

  const [isChecked, setIsChecked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => setIsChecked(isSynced), [isModalOpened, isSynced])

  useEffect(() => {
    return () => {
      if (isModalOpened) hidePassword() // modal closed
    }
  }, [hidePassword, isModalOpened])

  const isNpubExists = npub.trim().length && keys.some((key) => key.npub === npub)

  if (isModalOpened && !isNpubExists) {
    handleCloseModal()
    return null
  }
  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEnteredPassword(e.target.value.trim())
  }

  const onClose = () => {
    handleCloseModal()
    reset()
  }

  const handleChangeCheckbox = (e: unknown, checked: boolean) => {
    setIsChecked(checked)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPasswordInvalid(false)
    if (!isValidPassphase(enteredPassword)) {
      return setIsPasswordInvalid(true)
    }
    try {
      setIsLoading(true)
      await swicCall('saveKey', npub, enteredPassword)
      notify('Key saved', 'success')
      dbi.addSynced(npub) // Sync npub
      reset()
      setIsLoading(false)
    } catch (error) {
      reset()
      setIsLoading(false)
    }
  }

  return (
    <Modal open={isModalOpened} onClose={onClose} title="Settings">
      <Stack gap={'1rem'}>
        <StyledSettingContainer onSubmit={handleSubmit}>
          <Stack direction={'row'} justifyContent={'space-between'}>
            <SectionTitle>Cloud sync</SectionTitle>
            {isSynced && (
              <StyledSynchedText>
                <CheckmarkIcon /> Synched
              </StyledSynchedText>
            )}
          </Stack>
          <Box>
            <Checkbox onChange={handleChangeCheckbox} checked={isChecked} />
            <Typography variant="caption">Use this key on multiple devices</Typography>
          </Box>
          <Input
            fullWidth
            {...inputProps}
            onChange={handlePasswordChange}
            value={enteredPassword}
            placeholder="Enter a password"
            disabled={!isChecked}
          />
          <PasswordValidationStatus isPasswordInvalid={isPasswordInvalid} passwordStrength={passwordStrength} />
          <StyledButton type="submit" fullWidth disabled={!isChecked}>
            Sync {isLoading && <LoadingSpinner mode="secondary" />}
          </StyledButton>
        </StyledSettingContainer>
      </Stack>
    </Modal>
  )
}
