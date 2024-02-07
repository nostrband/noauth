import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Stack, Typography, useTheme } from '@mui/material'
import React, { ChangeEvent, useState } from 'react'
import { StyledAppLogo } from './styled'
import { Input } from '@/shared/Input/Input'
import { Button } from '@/shared/Button/Button'
import { CheckmarkIcon } from '@/assets'
import { swicCall } from '@/modules/swic'
import { useNavigate } from 'react-router-dom'
import { DOMAIN, NOAUTHD_URL } from '@/utils/consts'
import { fetchNip05 } from '@/utils/helpers/helpers'

export const ModalSignUp = () => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.SIGN_UP)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.SIGN_UP)
  const notify = useEnqueueSnackbar()
  const theme = useTheme()

  const navigate = useNavigate()

  const [enteredValue, setEnteredValue] = useState('')
  const [isAvailable, setIsAvailable] = useState(false)

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

  const inputHelperText = enteredValue ? (
    isAvailable ? (
      <>
        <CheckmarkIcon /> Available
      </>
    ) : (
      <>Already taken</>
    )
  ) : (
    "Don't worry, username can be changed later."
  )

  const handleSubmit = async (e: React.FormEvent) => {
    const name = enteredValue.trim()
    if (!name.length) return
    e.preventDefault()
    try {
      const k: any = await swicCall('generateKey', name)
      notify(`Account created for "${name}"`, 'success')
      navigate(`/key/${k.npub}`)
    } catch (error: any) {
      notify(error.message, 'error')
    }
  }

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
          label="Enter a Username"
          fullWidth
          placeholder="Username"
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
        <Button fullWidth type="submit">
          Create account
        </Button>
      </Stack>
    </Modal>
  )
}
