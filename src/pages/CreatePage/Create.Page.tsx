import { Stack, Typography } from '@mui/material'
import { GetStartedButton, LearnMoreButton } from './styled'
import { DOMAIN } from '@/utils/consts'
import { useSearchParams } from 'react-router-dom'
import { swicCall } from '@/modules/swic'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { ModalConfirmConnect } from '@/components/Modal/ModalConfirmConnect/ModalConfirmConnect'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { useEffect, useState } from 'react'
import { getReferrerAppUrl, isValidUserName } from '@/utils/helpers/helpers'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { Input } from '@/shared/Input/Input'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { usePassword } from '@/hooks/usePassword'
import { PasswordValidationStatus } from '@/shared/PasswordValidationStatus/PasswordValidationStatus'
import { usePasswordValidation } from '@/hooks/usePasswordValidation'
import { FormInputType, schema } from './const'
import { dbi } from '@/modules/db'

const FORM_DEFAULT_VALUES: FormInputType = {
  password: '',
  rePassword: '',
}

const CreatePage = () => {
  const notify = useEnqueueSnackbar()
  const { handleOpen } = useModalSearchParams()
  const [created, setCreated] = useState(false)

  const {
    handleSubmit,
    register,
    formState: { errors },
    watch,
    reset: resetForm,
  } = useForm<FormInputType>({
    defaultValues: FORM_DEFAULT_VALUES,
    resolver: yupResolver(schema),
    mode: 'onSubmit',
  })

  const enteredPassword = watch('password') || ''

  const { hidePassword, inputProps } = usePassword()
  const { hidePassword: hideConfirmPassword, inputProps: confirmPasswordInputProps } = usePassword()
  const { isPasswordInvalid, passwordStrength, reset: resetPasswordValidation } = usePasswordValidation(enteredPassword)

  const [searchParams] = useSearchParams()

  const [isLoading, setIsLoading] = useState(false)

  const name = searchParams.get('name') || ''
  const token = searchParams.get('token') || ''
  const appNpub = searchParams.get('appNpub') || ''
  const isValid = name && token && appNpub

  const nip05 = `${name}@${DOMAIN}`

  const handleLearnMore = () => {
    // @ts-ignore
    window.open(`https://${DOMAIN}`, '_blank').focus()
  }

  useEffect(() => {
    return () => {
      resetForm()
      hidePassword()
      hideConfirmPassword()
      setIsLoading(false)
    }
    // eslint-disable-next-line
  }, [])

  if (!isValid) {
    return (
      <Stack maxHeight={'100%'} overflow={'auto'}>
        <Typography textAlign={'center'} variant="h6" paddingTop="1em">
          Bad parameters.
        </Typography>
      </Stack>
    )
  }

  const isValidName = isValidUserName(name)

  const submitHandler = async (values: FormInputType) => {
    hidePassword()
    hideConfirmPassword()
    if (!isValidName) return
    try {
      const { password } = values
      setIsLoading(true)
      const key: any = await swicCall('generateKey', name, password)
      const appUrl = getReferrerAppUrl()
      await dbi.addSynced(key.npub)
      console.log('Created', key.npub, 'app', appUrl)
      setCreated(true)
      setIsLoading(false)
      resetPasswordValidation()
      resetForm()
      handleOpen(MODAL_PARAMS_KEYS.CONFIRM_CONNECT, {
        search: {
          npub: key.npub,
          appNpub,
          appUrl,
          token,
          // needed for this screen itself
          name,
          // will close after all done
          popup: 'true',
        },
        replace: true,
      })
    } catch (error: any) {
      notify(error.message || error.toString(), 'error')
      setIsLoading(false)
    }
  }

  return (
    <>
      <Stack maxHeight={'100%'} overflow={'auto'}>
        {created && (
          <>
            <Typography textAlign={'center'} variant="h4" paddingTop="0.5em">
              Account created!
            </Typography>
            <Typography textAlign={'center'} variant="body1" paddingTop="0.5em">
              User name: <b>{nip05}</b>
            </Typography>
          </>
        )}
        {!created && (
          <>
            <Typography textAlign={'center'} variant="h4" paddingTop="0.5em">
              Welcome to Nostr!
            </Typography>
            <Stack gap={'0.5rem'} overflow={'auto'}>
              <Typography textAlign={'left'} variant="h6" paddingTop="0.5em">
                Chosen name: <b>{nip05}</b>
              </Typography>
              <Stack gap={'0.5rem'} component={'form'} onSubmit={handleSubmit(submitHandler)}>
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
                <GetStartedButton type="submit" disabled={isLoading}>Create account {isLoading && <LoadingSpinner />}</GetStartedButton>
              </Stack>

              <Typography textAlign={'left'} variant="h5" paddingTop="1em">
                What you need to know:
              </Typography>

              <ol style={{ marginLeft: '1em' }}>
                <li>Nostr accounts are based on cryptographic keys.</li>
                <li>All your actions on Nostr will be signed by your keys.</li>
                <li>Nsec.app is one of many services to manage Nostr keys.</li>
                <li>When you create an account, a new key will be created.</li>
                <li>This key can later be used with other Nostr websites.</li>
              </ol>
              <LearnMoreButton onClick={handleLearnMore}>Learn more</LearnMoreButton>
            </Stack>
          </>
        )}
      </Stack>
      <ModalConfirmConnect />
    </>
  )
}

export default CreatePage
