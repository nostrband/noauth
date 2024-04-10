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
import { askNotificationPermission, getReferrerAppUrl, isValidUserName } from '@/utils/helpers/helpers'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { Input } from '@/shared/Input/Input'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { usePassword } from '@/hooks/usePassword'
import { PasswordValidationStatus } from '@/shared/PasswordValidationStatus/PasswordValidationStatus'
import { usePasswordValidation } from '@/hooks/usePasswordValidation'
import { FormInputType, schema } from './const'
import { CreateConnectParams } from '@/modules/backend/types'
import { nip19 } from 'nostr-tools'

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
  const perms = searchParams.get('perms') || ''
  const redirect_uri = searchParams.get('redirect_uri') || ''
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

      // first thing on user action is to ask for notifs
      await askNotificationPermission()
      const ok = await swicCall('enablePush')
      if (!ok) throw new Error('Failed to activate the push subscription')
      console.log('enablePush done')

      const appUrl = getReferrerAppUrl()
      const params: CreateConnectParams = {
        name,
        password,
        appNpub,
        perms,
        appUrl,
      }
      const req: any = await swicCall('generateKeyConnect', params)
      console.log('Created', req.npub, 'app', appUrl)

      await swicCall('confirm', req.id, true, true, {})
      console.log('confirmed', req.id)

      setCreated(true)
      resetPasswordValidation()
      resetForm()

      try {
        await swicCall('redeemToken', req.npub, token)
        console.log('redeemToken done')

        // auto-close/redirect only if redeem succeeded
        if (redirect_uri) {
          const { data: result } = nip19.decode(req.npub)
          const url = `${redirect_uri}${redirect_uri.includes('?') ? '&' : '?'}result=${encodeURIComponent(result as string)}`
          window.location.href = url
        } else {
          new Promise(ok => setTimeout(ok, 3000))
          .then(_ => window.close());
        }
      } catch (e) {
        console.log('error', e)
        notify('App did not reply. Please try to log in.', 'error')
      }

      setIsLoading(false)
      // handleOpen(MODAL_PARAMS_KEYS.CONFIRM_CONNECT, {
      //   search: {
      //     npub: req.npub,
      //     reqId: req.id,
      //     token,
      //     // needed for this screen itself
      //     name,
      //     appNpub,
      //     // will close after all done
      //     popup: 'true',
      //     redirect_uri,
      //     subNpub: req?.subNpub || '',
      //   },
      //   replace: true,
      // })
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
                <GetStartedButton type="submit" disabled={isLoading}>
                  Create account {isLoading && <LoadingSpinner />}
                </GetStartedButton>
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
