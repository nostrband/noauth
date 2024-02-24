import { Fragment, useCallback, useEffect, useState } from 'react'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Stack, Typography, useTheme } from '@mui/material'
import { Input } from '@/shared/Input/Input'
import { Button } from '@/shared/Button/Button'
import { CheckmarkIcon } from '@/assets'
import { swicCall } from '@/modules/swic'
import { useNavigate } from 'react-router-dom'
import { DOMAIN } from '@/utils/consts'
import { fetchNip05, isValidUserName } from '@/utils/helpers/helpers'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { PasswordValidationStatus } from '@/shared/PasswordValidationStatus/PasswordValidationStatus'
import { usePassword } from '@/hooks/usePassword'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { FormInputType, schema } from './const'
import { usePasswordValidation } from '@/hooks/usePasswordValidation'
import { useDebounce } from 'use-debounce'
import { dbi } from '@/modules/db'

const FORM_DEFAULT_VALUES: FormInputType = {
  username: '',
  password: '',
  rePassword: '',
}

export const ModalSignUp = () => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.SIGN_UP)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.SIGN_UP)
  const notify = useEnqueueSnackbar()
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

  const enteredUsername = watch('username') || ''
  const [debouncedUsername] = useDebounce(enteredUsername, 100)

  const enteredPassword = watch('password') || ''

  const { hidePassword: hideConfirmPassword, inputProps: confirmPasswordInputProps } = usePassword()
  const { hidePassword, inputProps } = usePassword()
  const { isPasswordInvalid, passwordStrength, reset: resetPasswordValidation } = usePasswordValidation(enteredPassword)

  const navigate = useNavigate()

  const [isAvailable, setIsAvailable] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  const [isLoading, setIsLoading] = useState(false)

  const isValidName = isValidUserName(debouncedUsername)

  const checkIsUsernameAvailable = useCallback(async () => {
    if (!isValidName) return undefined
    try {
      setIsChecking(true)
      const npubNip05 = await fetchNip05(`${debouncedUsername.trim()}@${DOMAIN}`)
      setIsAvailable(!npubNip05)
      setIsChecking(false)
    } catch (error) {
      setIsAvailable(false)
      setIsChecking(false)
    }
  }, [debouncedUsername])

  useEffect(() => {
    checkIsUsernameAvailable()
  }, [checkIsUsernameAvailable])

  const getInputHelperText = () => {
    if (!enteredUsername.trim()) return "Username can be changed later."
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

  const submitHandler = async (values: FormInputType) => {
    hidePassword()
    hideConfirmPassword()
    if (isLoading || !isAvailable || isPasswordInvalid) return undefined
    const { password, username } = values
    if (!username.trim() || !password.trim()) throw new Error('Fill out all fields!')
    try {
      setIsLoading(true)
      const k: any = await swicCall('generateKey', username.trim(), password.trim())
      if (k.name) {
        notify(`Account created for "${k.name}"`, 'success')
        reset()
        dbi.addSynced(k.npub)
      } else {
        notify(`Failed to assign name "${username}", try again`, 'error')
      }
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
        hideConfirmPassword()
        hidePassword()
        resetPasswordValidation()
      }
    }
    // eslint-disable-next-line
  }, [isModalOpened])

  const getHelperTextColor = useCallback(() => {
    if (!debouncedUsername.trim() || isChecking) return theme.palette.textSecondaryDecorate.main
    return isValidName && isAvailable ? theme.palette.success.main : theme.palette.error.main
  }, [debouncedUsername, isAvailable, isChecking, theme])

  return (
    <Modal open={isModalOpened} onClose={handleCloseModal} withCloseButton={false}>
      <Stack paddingTop={'1rem'} gap={'1rem'} component={'form'} onSubmit={handleSubmit(submitHandler)}>
        <Stack gap={'0.2rem'} padding={'0 1rem'} alignSelf={'flex-start'}>
          <Typography fontWeight={600} variant="h5">
            Sign up
          </Typography>
          <Typography noWrap variant="body2" color={'GrayText'}>
            Generate new Nostr keys
          </Typography>
        </Stack>
        <Input
          label="Username"
          fullWidth
          placeholder="Enter a Username"
          helperText={inputHelperText}
          endAdornment={<Typography color={'#FFFFFFA8'}>@{DOMAIN}</Typography>}
          {...register('username')}
          error={!!errors.username}
          helperTextProps={{
            sx: {
              '&.helper_text': {
                color: getHelperTextColor(),
              },
            },
          }}
        />
        <Input
          label="Password"
          fullWidth
          {...inputProps}
          placeholder="Enter a password"
          {...register('password')}
          error={!!errors.password}
        />
        <Input
          label="Confirm Password"
          {...register('rePassword')}
          error={!!errors.rePassword}
          fullWidth
          {...confirmPasswordInputProps}
          placeholder="Confirm password"
        />
        {!errors?.rePassword?.message && (
          <PasswordValidationStatus
            isSignUp={true}
            boxProps={{ sx: { padding: '0 0.5rem' } }}
            isPasswordInvalid={isPasswordInvalid}
            passwordStrength={passwordStrength}
          />
        )}
        {!!errors?.rePassword?.message && (
          <Typography variant="body2" color={'red'}>
            {errors.rePassword.message}
          </Typography>
        )}
        <Stack gap={'0.5rem'}>
          <Button fullWidth type="submit" disabled={isLoading}>
            Create account {isLoading && <LoadingSpinner />}
          </Button>
        </Stack>
      </Stack>
    </Modal>
  )
}
