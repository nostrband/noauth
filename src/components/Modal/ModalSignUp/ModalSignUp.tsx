import { useCallback, useEffect, useMemo, useState } from 'react'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Box, Slide, Stack, Typography, useTheme } from '@mui/material'
import { Input } from '@/shared/Input/Input'
import { Button } from '@/shared/Button/Button'
import { useNavigate } from 'react-router-dom'
import { DOMAIN } from '@/utils/consts'
import { generateNip05, isValidUserName } from '@/utils/helpers/helpers'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { PasswordValidationStatus } from '@/shared/PasswordValidationStatus/PasswordValidationStatus'
import { usePassword } from '@/hooks/usePassword'
import { get, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { FormInputType, schema } from './const'
import { usePasswordValidation } from '@/hooks/usePasswordValidation'
import { useDebounce } from 'use-debounce'
import useStepper from '@/hooks/useStepper'
import { InputsContainer } from './styled'
import { getNameHelperTextProps } from './utils'
import { fetchNip05 } from '@/modules/common/helpers'
import { client } from '@/modules/swic'

const steps = ['Username field', 'Password fields']

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
    trigger,
    setValue,
  } = useForm<FormInputType>({
    defaultValues: FORM_DEFAULT_VALUES,
    resolver: yupResolver(schema),
    mode: 'onChange',
  })
  const { activeStep, handleBack, handleNext, isLastStep, handleReset: handleResetStepper } = useStepper(steps)

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
  }, [debouncedUsername, isValidName])

  useEffect(() => {
    checkIsUsernameAvailable()
  }, [checkIsUsernameAvailable])

  const submitHandler = async (values: FormInputType) => {
    hidePassword()
    hideConfirmPassword()
    if (isLoading || !isAvailable || isPasswordInvalid) return undefined
    const { password, username } = values
    if (!username.trim() || !password.trim()) throw new Error('Fill out all fields!')
    try {
      setIsLoading(true)
      const k = await client.generateKey(username.trim(), password.trim())
      if (k.name) {
        notify(`Account created for "${k.name}"`, 'success')
        reset()
        handleResetStepper()
      } else {
        notify(`Failed to assign name "${username}", try again`, 'error')
      }
      setIsLoading(false)
      setTimeout(() => {
        // give frontend time to read the new key first
        navigate(`/key/${k.npub}`)
      }, 300)
    } catch (error: any) {
      notify(error?.message || 'Something went wrong!' + error, 'error')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!enteredUsername) generateNip05().then((n) => setValue('username', n))

    return () => {
      if (isModalOpened) {
        // modal closed
        setIsLoading(false)
        setIsAvailable(false)
        hideConfirmPassword()
        hidePassword()
        resetPasswordValidation()
        handleResetStepper()
        reset()
      }
    }
    // eslint-disable-next-line
  }, [isModalOpened])

  const { color: nameHelperTextColor, value: nameHelperText } = useMemo(() => {
    const nameError = get(errors, 'username') || {}
    return getNameHelperTextProps(enteredUsername, isChecking, isAvailable, isValidName, nameError?.message, theme)
  }, [enteredUsername, errors, isAvailable, isChecking, isValidName, theme])

  const handleNextStep = async () => {
    const isStepValid = await trigger('username')
    if (!isStepValid || !enteredUsername.trim() || !isValidName || !isAvailable) return
    handleNext()
  }

  return (
    <Modal open={isModalOpened} onClose={handleCloseModal} withCloseButton={false}>
      <Stack
        paddingTop={'1rem'}
        gap={'1rem'}
        component={'form'}
        overflow={'hidden'}
        onSubmit={handleSubmit(submitHandler)}
      >
        <Stack gap={'0.2rem'} padding={'0 1rem'} alignSelf={'flex-start'}>
          <Typography fontWeight={600} variant="h5">
            Sign up
          </Typography>
          <Typography noWrap variant="body2" color={'GrayText'}>
            Generate new Nostr keys
          </Typography>
        </Stack>

        <Box>
          <Slide direction="right" in={activeStep === 0}>
            <InputsContainer show={activeStep === 0}>
              <Input
                label="Username"
                fullWidth
                placeholder="Enter a Username"
                endAdornment={<Typography color={theme.palette.textSecondaryDecorate.main}>@{DOMAIN}</Typography>}
                {...register('username')}
                error={!!errors.username}
                helperText={nameHelperText}
                helperTextColor={nameHelperTextColor}
                autoComplete="username"
                id="username"
              />
            </InputsContainer>
          </Slide>

          <Slide direction="left" in={activeStep === 1}>
            <InputsContainer show={activeStep === 1}>
              <Input
                label="Password"
                fullWidth
                {...inputProps}
                placeholder="Enter a password"
                {...register('password')}
                error={!!errors.password}
                autoComplete="new-password"
                id="new-password"
              />
              <Input
                label="Confirm Password"
                {...register('rePassword')}
                error={!!errors.rePassword}
                fullWidth
                {...confirmPasswordInputProps}
                placeholder="Confirm password"
                autoComplete="confirm-password"
                id="confirm-password"
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
            </InputsContainer>
          </Slide>
        </Box>

        {isLastStep && (
          <Button fullWidth type="submit" disabled={isLoading}>
            Create account {isLoading && <LoadingSpinner />}
          </Button>
        )}
        {!isLastStep && (
          <Button type="button" onClick={handleNextStep}>
            Next
          </Button>
        )}
        {activeStep !== 0 && (
          <Button type="button" varianttype="secondary" onClick={handleBack}>
            Back
          </Button>
        )}
      </Stack>
    </Modal>
  )
}
