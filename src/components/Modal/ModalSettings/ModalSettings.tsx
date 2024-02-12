import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Button } from '@/shared/Button/Button'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Box, CircularProgress, Stack, Typography } from '@mui/material'
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
  const [isPasswordInvalid, setIsPasswordInvalid] = useState(false)

  const [isChecked, setIsChecked] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => setIsChecked(isSynced), [isModalOpened, isSynced])

  useEffect(() => {
    return () => {
      if (isModalOpened) {
        // modal closed
        hidePassword()
      }
    }
  }, [hidePassword, isModalOpened])

  const isNpubExists = npub.trim().length && keys.some((key) => key.npub === npub)

  if (isModalOpened && !isNpubExists) {
    handleCloseModal()
    return null
  }

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIsPasswordInvalid(false)
    setEnteredPassword(e.target.value)
  }

  const onClose = () => {
    handleCloseModal()
    setEnteredPassword('')
    setIsPasswordInvalid(false)
  }

  const handleChangeCheckbox = (e: unknown, checked: boolean) => {
    setIsChecked(checked)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsPasswordInvalid(false)

    if (enteredPassword.trim().length < 6) {
      return setIsPasswordInvalid(true)
    }
    try {
      setIsLoading(true)
      await swicCall('saveKey', npub, enteredPassword)
      notify('Key saved', 'success')
      dbi.addSynced(npub) // Sync npub
      setEnteredPassword('')
      setIsPasswordInvalid(false)
      setIsLoading(false)
    } catch (error) {
      setIsPasswordInvalid(false)
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
            helperText={isPasswordInvalid ? 'Invalid password' : ''}
            placeholder="Enter a password"
            helperTextProps={{
              sx: {
                '&.helper_text': {
                  color: 'red',
                },
              },
            }}
            disabled={!isChecked}
          />
          {isSynced ? (
            <Typography variant="body2" color={'GrayText'}>
              To change your password, type a new one and sync.
            </Typography>
          ) : (
            <Typography variant="body2" color={'GrayText'}>
              This key will be encrypted and stored on our server. You can use the password to download this key onto
              another device.
            </Typography>
          )}
          <StyledButton type="submit" fullWidth disabled={!isChecked}>
            Sync {isLoading && <CircularProgress sx={{ marginLeft: '0.5rem' }} size={'1rem'} />}
          </StyledButton>
        </StyledSettingContainer>
        <Button onClick={onClose}>Done</Button>
      </Stack>
    </Modal>
  )
}
