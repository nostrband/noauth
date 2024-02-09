import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { swicCall } from '@/modules/swic'
import { Button } from '@/shared/Button/Button'
import { Input } from '@/shared/Input/Input'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { CircularProgress, Stack, Typography, useTheme } from '@mui/material'
import { StyledAppLogo } from './styled'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FormInputType, schema } from './const'
import { yupResolver } from '@hookform/resolvers/yup'
import { usePassword } from '@/hooks/usePassword'
import { useCallback, useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { fetchNip05 } from '@/utils/helpers/helpers'
import { DOMAIN } from '@/utils/consts'
import { CheckmarkIcon } from '@/assets'

const FORM_DEFAULT_VALUES = {
  username: '',
  nsec: '',
}

export const ModalImportKeys = () => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.IMPORT_KEYS)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.IMPORT_KEYS)
  const { hidePassword, inputProps } = usePassword()
  const theme = useTheme()

  const {
    handleSubmit,
    reset,
    register,
    formState: { errors },
    watch,
  } = useForm<FormInputType>({
    defaultValues: FORM_DEFAULT_VALUES,
    resolver: yupResolver(schema),
    mode: 'onSubmit',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)
  const enteredUsername = watch('username')
  const [debouncedUsername] = useDebounce(enteredUsername, 100)

  const checkIsUsernameAvailable = useCallback(async () => {
    if (!debouncedUsername.trim().length) return undefined
    const npubNip05 = await fetchNip05(`${debouncedUsername}@${DOMAIN}`)

    setIsAvailable(!npubNip05)
  }, [debouncedUsername])

  useEffect(() => {
    checkIsUsernameAvailable()
  }, [checkIsUsernameAvailable])

  const cleanUpStates = useCallback(() => {
    hidePassword()
    reset()
    setIsLoading(false)
    setIsAvailable(false)
  }, [reset, hidePassword])

  const notify = useEnqueueSnackbar()
  const navigate = useNavigate()

  const submitHandler = async (values: FormInputType) => {
    if (isLoading || !isAvailable) return undefined
    try {
      const { nsec, username } = values
      setIsLoading(true)
      const k: any = await swicCall('importKey', username, nsec)
      notify('Key imported!', 'success')
      navigate(`/key/${k.npub}`)
      cleanUpStates()
    } catch (error: any) {
      notify(error?.message || 'Something went wrong!', 'error')
      cleanUpStates()
    }
  }

  useEffect(() => {
    return () => {
      isModalOpened && cleanUpStates()
    }
  }, [isModalOpened, cleanUpStates])

  const getInputHelperText = () => {
    if (!enteredUsername) return "Don't worry, username can be changed later."
    if (!isAvailable) return 'Already taken'
    return (
      <>
        <CheckmarkIcon /> Available
      </>
    )
  }

  const inputHelperText = getInputHelperText()

  return (
    <Modal open={isModalOpened} onClose={handleCloseModal}>
      <Stack gap={'1rem'} component={'form'} onSubmit={handleSubmit(submitHandler)}>
        <Stack direction={'row'} gap={'1rem'} alignItems={'center'} alignSelf={'flex-start'}>
          <StyledAppLogo />
          <Typography fontWeight={600} variant="h5">
            Import keys
          </Typography>
        </Stack>
        <Input
          label="Username"
          fullWidth
          placeholder="Enter a Username"
          endAdornment={<Typography color={'#FFFFFFA8'}>@{DOMAIN}</Typography>}
          {...register('username')}
          error={!!errors.username}
          helperText={inputHelperText}
          helperTextProps={{
            sx: {
              '&.helper_text': {
                color:
                  enteredUsername && isAvailable
                    ? theme.palette.success.main
                    : enteredUsername && !isAvailable
                      ? theme.palette.error.main
                      : theme.palette.textSecondaryDecorate.main,
              },
            },
          }}
        />
        <Input
          label="Enter a NSEC"
          placeholder="Your NSEC"
          fullWidth
          {...register('nsec')}
          error={!!errors.nsec}
          {...inputProps}
        />

        <Button type="submit" disabled={isLoading}>
          Import nsec {isLoading && <CircularProgress sx={{ marginLeft: '0.5rem' }} size={'1rem'} />}
        </Button>
      </Stack>
    </Modal>
  )
}
