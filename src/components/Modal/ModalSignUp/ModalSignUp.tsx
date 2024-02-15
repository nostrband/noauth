import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Stack, Typography, useTheme } from '@mui/material'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { StyledAppLogo } from './styled'
import { Input } from '@/shared/Input/Input'
import { Button } from '@/shared/Button/Button'
import { CheckmarkIcon } from '@/assets'
import { swicCall } from '@/modules/swic'
import { useNavigate } from 'react-router-dom'
import { DOMAIN } from '@/utils/consts'
import { fetchNip05 } from '@/utils/helpers/helpers'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'

export const ModalSignUp = () => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.SIGN_UP)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.SIGN_UP)
  const notify = useEnqueueSnackbar()
  const theme = useTheme()

  const navigate = useNavigate()

  const [enteredValue, setEnteredValue] = useState('')
  const [isAvailable, setIsAvailable] = useState(false)

  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setEnteredValue(e.target.value)
    const name = e.target.value.trim()
    if (name) {
      const npubNip05 = await fetchNip05(`${name}@${DOMAIN}`)
      setIsAvailable(!npubNip05)
    } else {
      setIsAvailable(false)
    }
  }

  const getInputHelperText = () => {
    if (!enteredValue) return "Don't worry, username can be changed later."
    if (!isAvailable) return 'Already taken'
    return (
      <>
        <CheckmarkIcon /> Available
      </>
    )
  }

  const inputHelperText = getInputHelperText()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading || !isAvailable) return undefined

    const name = enteredValue.trim()
    if (!name.length) return

    try {
      setIsLoading(true)
      const k: any = await swicCall('generateKey', name)
      notify(`Account created for "${name}"`, 'success')
      setIsLoading(false)
      setTimeout(() => {
        // give frontend time to read the new key first
        navigate(`/key/${k.npub}`)
      }, 300)
    } catch (error: any) {
      notify(error?.message || 'Something went wrong!', 'error')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (isModalOpened) {
        // modal closed
        setIsLoading(false)
        setIsAvailable(false)
      }
    }
  }, [isModalOpened])

  return (
    <Modal open={isModalOpened} onClose={handleCloseModal}>
      <Stack paddingTop={'1rem'} gap={'1rem'} component={'form'} onSubmit={handleSubmit}>
        <Stack direction={'row'} gap={'1rem'} alignItems={'center'} alignSelf={'flex-start'}>
          <StyledAppLogo />
          <Typography fontWeight={600} variant="h5">
            Sign up
          </Typography>
        </Stack>
        <Input
          label="Username"
          fullWidth
          placeholder="Enter a Username"
          helperText={inputHelperText}
          endAdornment={<Typography color={'#FFFFFFA8'}>@{DOMAIN}</Typography>}
          onChange={handleInputChange}
          value={enteredValue}
          helperTextProps={{
            sx: {
              '&.helper_text': {
                color:
                  enteredValue && isAvailable
                    ? theme.palette.success.main
                    : enteredValue && !isAvailable
                      ? theme.palette.error.main
                      : theme.palette.textSecondaryDecorate.main,
              },
            },
          }}
        />
        <Button fullWidth type="submit" disabled={isLoading}>
          Create account {isLoading && <LoadingSpinner />}
        </Button>
      </Stack>
    </Modal>
  )
}
