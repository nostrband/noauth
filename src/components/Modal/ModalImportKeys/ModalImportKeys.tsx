import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { swicCall } from '@/modules/swic'
import { Button } from '@/shared/Button/Button'
import { Input } from '@/shared/Input/Input'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Stack, Typography, useTheme } from '@mui/material'
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
import { getPublicKey, nip19 } from 'nostr-tools'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { HeadingContainer } from './styled'
import { PasswordValidationStatus } from '@/shared/PasswordValidationStatus/PasswordValidationStatus'
import { usePasswordValidation } from '@/hooks/usePasswordValidation'

const FORM_DEFAULT_VALUES: FormInputType = {
  username: '',
  nsec: '',
  password: '',
  rePassword: '',
}

export const ModalImportKeys = () => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.IMPORT_KEYS)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.IMPORT_KEYS)
  const { hidePassword: hideNsec, inputProps: nsecInputProps } = usePassword()
  const { hidePassword: hideConfirmPassword, inputProps: confirmPasswordInputProps } = usePassword()
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
  const [nameNpub, setNameNpub] = useState('')
  const [isTakenByNsec, setIsTakenByNsec] = useState(false)
  const [isBadNsec, setIsBadNsec] = useState(false)
  const enteredUsername = watch('username') || ''
  const enteredNsec = watch('nsec') || ''
  const enteredPassword = watch('password') || ''
  const [debouncedUsername] = useDebounce(enteredUsername, 100)
  const [debouncedNsec] = useDebounce(enteredNsec, 100)

  const { isPasswordInvalid, passwordStrength, reset: resetPasswordValidation } = usePasswordValidation(enteredPassword)

  const checkIsUsernameAvailable = useCallback(async () => {
    if (!debouncedUsername.trim().length) return undefined
    const npubNip05 = await fetchNip05(`${debouncedUsername}@${DOMAIN}`)
    setNameNpub(npubNip05 || '')
  }, [debouncedUsername])

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
      const { type, data } = nip19.decode(debouncedNsec)
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
  }, [reset, hideNsec, hidePassword, hideConfirmPassword, resetPasswordValidation])

  const notify = useEnqueueSnackbar()
  const navigate = useNavigate()

  const submitHandler = async (values: FormInputType) => {
    hideNsec()
    hidePassword()
    hideConfirmPassword()
    if (isLoading) return undefined
    try {
      const { nsec, username } = values
      if (!nsec || !username) throw new Error('Enter username and nsec')
      if (nameNpub && !isTakenByNsec) throw new Error('Name taken')
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

  const getNameHelperText = () => {
    if (!enteredUsername) return "Don't worry, username can be changed later."
    if (isTakenByNsec) return 'Name matches your key'
    if (isBadNsec) return 'Invalid nsec'
    if (nameNpub) return 'Already taken'
    return (
      <>
        <CheckmarkIcon /> Available
      </>
    )
  }

  const getNsecHelperText = () => {
    if (isBadNsec) return 'Invalid nsec'
    return 'Keys stay on your device.'
  }

  const nameHelperText = getNameHelperText()
  const nsecHelperText = getNsecHelperText()

  return (
    <Modal open={isModalOpened} onClose={handleCloseModal} withCloseButton={false}>
      <Stack paddingTop={'1rem'} gap={'1rem'} component={'form'} onSubmit={handleSubmit(submitHandler)}>
        <HeadingContainer>
          <Typography fontWeight={600} variant="h5">
            Import key
          </Typography>
          <Typography noWrap variant="body2" color={'GrayText'}>
            Bring your existing Nostr keys to Nsec.app
          </Typography>
        </HeadingContainer>
        <Input
          label="Choose a username"
          fullWidth
          placeholder="Enter a Username"
          endAdornment={<Typography color={'#FFFFFFA8'}>@{DOMAIN}</Typography>}
          {...register('username')}
          error={!!errors.username}
          helperText={nameHelperText}
          helperTextProps={{
            sx: {
              '&.helper_text': {
                color:
                  enteredUsername && (isTakenByNsec || !nameNpub)
                    ? theme.palette.success.main
                    : enteredUsername && nameNpub
                      ? theme.palette.error.main
                      : theme.palette.textSecondaryDecorate.main,
              },
            },
          }}
        />
        <Input
          label="Paste your private key"
          placeholder="nsec1..."
          fullWidth
          {...register('nsec')}
          error={!!errors.nsec}
          {...nsecInputProps}
          helperText={nsecHelperText}
          helperTextProps={{
            sx: {
              '&.helper_text': {
                color: isBadNsec ? theme.palette.error.main : theme.palette.textSecondaryDecorate.main,
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
        <Button type="submit" disabled={isLoading}>
          Import key {isLoading && <LoadingSpinner />}
        </Button>
      </Stack>
    </Modal>
  )
}
