import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Button } from '@/shared/Button/Button'
import { Input } from '@/shared/Input/Input'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Box, Slide, Typography, useTheme } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { get, useForm } from 'react-hook-form'
import { schema } from './const'
import { yupResolver } from '@hookform/resolvers/yup'
import { usePassword } from '@/hooks/usePassword'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { isValidUserName } from '@/utils/helpers/helpers'
import { DOMAIN } from '@/utils/consts'
import { getPublicKey, nip19 } from 'nostr-tools'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { Container, HeadingContainer, InputsContainer, Subtitle } from './styled'
import { PasswordValidationStatus } from '@/shared/PasswordValidationStatus/PasswordValidationStatus'
import { usePasswordValidation } from '@/hooks/usePasswordValidation'
import useStepper from '@/hooks/useStepper'
import { getNameHelperTextProps, getNsecHelperTextProps } from './utils'
import { fetchNip05 } from '@/modules/common/helpers'
import { client } from '@/modules/swic'

const FORM_DEFAULT_VALUES = {
  username: '',
  nsec: '',
  password: '',
  rePassword: '',
}

const steps = ['User info fields', 'Password fields']

export const ModalImportKeys = () => {
  const theme = useTheme()
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.IMPORT_KEYS)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.IMPORT_KEYS)

  const { hidePassword, inputProps } = usePassword()
  const { hidePassword: hideNsec, inputProps: nsecInputProps } = usePassword()
  const { hidePassword: hideConfirmPassword, inputProps: confirmPasswordInputProps } = usePassword()

  const { activeStep, handleBack, handleNext, isLastStep, handleReset: handleResetStepper } = useStepper(steps)
  const {
    handleSubmit,
    reset,
    register,
    formState: { errors },
    watch,
    trigger,
  } = useForm({
    defaultValues: FORM_DEFAULT_VALUES,
    resolver: yupResolver(schema),
    mode: 'onChange',
  })

  const [isLoading, setIsLoading] = useState(false)
  const [nameNpub, setNameNpub] = useState('')
  const [isTakenByNsec, setIsTakenByNsec] = useState(false)
  const [isBadNsec, setIsBadNsec] = useState(false)
  const enteredUsername = watch('username') || ''
  const enteredNsec = watch('nsec') || ''
  const enteredPassword = watch('password') || ''
  const [debouncedUsername] = useDebounce(enteredUsername, 100)
  const [debouncedNsec] = useDebounce(enteredNsec, 100)

  const { isPasswordInvalid, passwordStrength, reset: resetPasswordValidation } = usePasswordValidation(enteredPassword)

  const isValidName = isValidUserName(debouncedUsername)

  const checkIsUsernameAvailable = useCallback(async () => {
    if (!isValidName) return undefined
    const npubNip05 = await fetchNip05(`${debouncedUsername.trim()}@${DOMAIN}`)
    setNameNpub(npubNip05 || '')
  }, [debouncedUsername, isValidName])

  useEffect(() => {
    checkIsUsernameAvailable()
  }, [checkIsUsernameAvailable])

  const checkNsecUsername = useCallback(async () => {
    if (!debouncedNsec.trim().length) {
      setIsTakenByNsec(false)
      setIsBadNsec(false)
      return
    }
    try {
      const { type, data } = nip19.decode(debouncedNsec.trim())
      const ok = type === 'nsec'
      setIsBadNsec(!ok)
      if (ok) {
        const npub = nip19.npubEncode(
          // @ts-ignore
          getPublicKey(data)
        )
        setIsTakenByNsec(!!nameNpub && nameNpub === npub)
      } else {
        setIsTakenByNsec(false)
      }
    } catch {
      setIsBadNsec(true)
      setIsTakenByNsec(false)
      return
    }
    // eslint-disable-next-line
  }, [debouncedNsec])

  useEffect(() => {
    checkNsecUsername()
  }, [checkNsecUsername])

  const cleanUpStates = useCallback(() => {
    hidePassword()
    hideConfirmPassword()
    hideNsec()
    reset()
    resetPasswordValidation()
    setIsLoading(false)
    setNameNpub('')
    setIsTakenByNsec(false)
    setIsBadNsec(false)
    handleResetStepper()
  }, [reset, hideNsec, hidePassword, hideConfirmPassword, resetPasswordValidation, handleResetStepper])

  const notify = useEnqueueSnackbar()
  const navigate = useNavigate()

  const submitHandler = async (values: any) => {
    hideNsec()
    hidePassword()
    hideConfirmPassword()
    if (isLoading || isPasswordInvalid) return undefined
    try {
      const { nsec, username, password } = values
      if (!nsec.trim() || !username.trim() || !password.trim()) throw new Error('Fill out all fields!')
      if (nameNpub && !isTakenByNsec) throw new Error('Name taken')
      setIsLoading(true)
      const k = await client.importKey(username.trim(), nsec.trim(), password.trim())
      notify('Key imported!', 'success')
      navigate(`/key/${k.npub}`)
      cleanUpStates()
    } catch (error: any) {
      notify(error?.message || 'Something went wrong!', 'error')
      cleanUpStates()
    }
  }

  useEffect(
    () => () => {
      isModalOpened && cleanUpStates()
    },
    [isModalOpened, cleanUpStates]
  )

  const { color: nameHelperTextColor, value: nameHelperText } = useMemo(() => {
    const nameError = get(errors, 'username') || {}
    return getNameHelperTextProps(
      enteredUsername,
      nameNpub,
      isValidName,
      isTakenByNsec,
      isBadNsec,
      nameError?.message,
      theme
    )
  }, [enteredUsername, errors, isBadNsec, isTakenByNsec, isValidName, nameNpub, theme])

  const { color: nsecHelperTextColor, value: nsecHelperText } = useMemo(() => {
    const nsecError = get(errors, 'nsec') || {}
    return getNsecHelperTextProps(isBadNsec, nsecError?.message, theme)
  }, [errors, isBadNsec, theme])

  const handleNextStep = async () => {
    const isStepValid = await trigger(['username', 'nsec'])
    if (
      !isStepValid ||
      (nameNpub && !isTakenByNsec) ||
      isBadNsec ||
      !enteredUsername.trim() ||
      !enteredNsec.trim() ||
      !isValidName
    )
      return
    handleNext()
  }

  return (
    <Modal open={isModalOpened} onClose={handleCloseModal} withCloseButton={false}>
      <Container component={'form'} overflow={'hidden'} onSubmit={handleSubmit(submitHandler)}>
        <HeadingContainer>
          <Typography fontWeight={600} variant="h5">
            Import key
          </Typography>
          <Subtitle>Bring your existing Nostr keys to Nsec.app</Subtitle>
        </HeadingContainer>

        <Box>
          <Slide direction="right" in={activeStep === 0}>
            <InputsContainer show={activeStep === 0}>
              <Input
                label="Choose a username"
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
              <Input
                label="Paste your private key"
                placeholder="nsec1..."
                fullWidth
                {...register('nsec')}
                error={!!errors.nsec}
                {...nsecInputProps}
                helperText={nsecHelperText}
                helperTextColor={nsecHelperTextColor}
                autoComplete="off"
              />
            </InputsContainer>
          </Slide>

          <Slide in={activeStep === 1} exit direction="left">
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
              {!errors.rePassword?.message && (
                <PasswordValidationStatus
                  isSignUp={true}
                  boxProps={{ sx: { padding: '0 0.5rem' } }}
                  isPasswordInvalid={isPasswordInvalid}
                  passwordStrength={passwordStrength}
                />
              )}
              {!!errors.rePassword?.message && (
                <Typography variant="body2" color={'red'} padding={'0 0.5rem'}>
                  {errors.rePassword.message}
                </Typography>
              )}
            </InputsContainer>
          </Slide>
        </Box>
        {isLastStep && (
          <Button type="submit" disabled={isLoading}>
            Import key {isLoading && <LoadingSpinner />}
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
      </Container>
    </Modal>
  )
}
