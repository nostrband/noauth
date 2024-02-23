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
import { isValidPassphase, isWeakPassphase } from '@/modules/keys'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { useCopyToClipboard } from 'usehooks-ts'

type ModalSettingsProps = {
  isSynced: boolean
}

export const ModalSettings: FC<ModalSettingsProps> = ({ isSynced }) => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const { npub = '' } = useParams<{ npub: string }>()
  const keys = useAppSelector(selectKeys)
  const [_, copyToClipboard] = useCopyToClipboard()

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
    const password = e.target.value
    setIsPasswordInvalid(!!password && !isValidPassphase(password))
    setEnteredPassword(password)
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

    if (!isValidPassphase(enteredPassword)) {
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

  const exportKey = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const key = await swicCall('exportKey', npub) as string
      if (await copyToClipboard(key))
        notify('Key copied to clipboard!')
      else
        notify('Failed to copy to clipboard', 'error')
    } catch (error) {
      console.log("error", error)
      notify(`Failed to copy to clipboard: ${error}`, 'error')
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
          {isPasswordInvalid ? (
            <Typography variant="body2" color={'red'}>
              Password must include 6+ English letters, numbers or punctuation marks.
            </Typography>
          ) : !!enteredPassword && isWeakPassphase(enteredPassword) ? (
            <Typography variant="body2" color={'orange'}>
              Weak password
            </Typography>
          ) : !!enteredPassword && !isPasswordInvalid ? (
            <Typography variant="body2" color={'green'}>
              Good password
            </Typography>
          ) : isSynced ? (
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
            Sync {isLoading && <LoadingSpinner mode="secondary" />}
          </StyledButton>
        </StyledSettingContainer>

        <StyledSettingContainer>
          <Stack direction={'row'} justifyContent={'space-between'}>
            <SectionTitle>Export key</SectionTitle>
          </Stack>
          <Typography variant="body2" color={'GrayText'}>
            Export your key encrypted with your password (NIP49)
          </Typography>
          <StyledButton type="submit" fullWidth onClick={exportKey}>
            Export
          </StyledButton>
        </StyledSettingContainer>
      </Stack>
    </Modal>
  )
}
