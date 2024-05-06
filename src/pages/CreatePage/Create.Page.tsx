import { Box, Stack, Typography } from '@mui/material'
import { GetStartedButton } from './styled'
import { DOMAIN } from '@/utils/consts'
import { useSearchParams } from 'react-router-dom'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { ModalConfirmConnect } from '@/components/Modal/ModalConfirmConnect/ModalConfirmConnect'
import { useEffect, useState } from 'react'
import {
  askNotificationPermission,
  getNotificationPermission,
  getReferrerAppUrl,
  isValidUserName,
} from '@/utils/helpers/helpers'
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
import { Button } from '@/shared/Button/Button'
import { client } from '@/modules/swic'

const FORM_DEFAULT_VALUES: FormInputType = {
  password: '',
  rePassword: '',
}

const CreatePage = () => {
  const notify = useEnqueueSnackbar()

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

  const [searchParams, setSearchParams] = useSearchParams()

  const [isLoading, setIsLoading] = useState(false)

  const created = searchParams.get('created') === 'true'
  const name = searchParams.get('name') || ''
  const token = searchParams.get('token') || ''
  const appNpub = searchParams.get('appNpub') || ''
  const perms = searchParams.get('perms') || ''
  const redirect_uri = searchParams.get('redirect_uri') || ''
  const isValid = name && token && appNpub

  const nip05 = `${name}@${DOMAIN}`

  const isGranted = getNotificationPermission()

  // const handleLearnMore = () => {
  //   // @ts-ignore
  //   window.open(`https://${DOMAIN}`, '_blank').focus()
  // }

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
      const ok = await client.enablePush()
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
      const npub = await client.generateKeyConnect(params)
      console.log('Created', npub, 'app', appUrl)

      // redirect the window to new url and
      // make sure back doesn't show the form again
      searchParams.append('created', 'true')
      setSearchParams(searchParams, { replace: true })

      resetPasswordValidation()
      resetForm()

      try {
        await client.redeemToken(npub, token)
        console.log('redeemToken done')

        // auto-close/redirect only if redeem succeeded
        if (redirect_uri) {
          const { data: result } = nip19.decode(npub)
          const url = `${redirect_uri}${redirect_uri.includes('?') ? '&' : '?'}result=${encodeURIComponent(result as string)}`
          window.location.href = url
        } else {
          // just show the 'close' button
          // new Promise((ok) => setTimeout(ok, 3000)).then((_) => window.close())
        }
      } catch (e) {
        console.log('error', e)
        notify('App connection timeout. Please try to log in.', 'error')
      }

      setIsLoading(false)
    } catch (error: any) {
      notify(error.message || error.toString(), 'error')
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    window.close()
  }

  return (
    <>
      <Stack maxHeight={'100%'} overflow={'auto'}>
        {created && (
          <>
            <Typography textAlign={'center'} variant="h4" paddingTop="0.5em">
              All set!
              <br />
              You can now return to your app
            </Typography>
            <Box marginTop={'1rem'}>
              <Button fullWidth onClick={handleClose}>
                Close
              </Button>
            </Box>

            <Typography textAlign={'left'} variant="h6" paddingTop={'1.5em'}>
              Need to update permissions?
            </Typography>
            <Typography textAlign={'left'} variant="body2">
              Come back to Nsec.app any time to manage the access of various apps to your Nostr keys.
            </Typography>
          </>
        )}
        {!created && (
          <>
            <Typography textAlign={'center'} variant="h4" paddingTop="0.5em">
              Set a password
            </Typography>
            <Typography textAlign={'center'} variant="body1" paddingTop="1em">
              Your username:
            </Typography>
            <Typography textAlign={'center'} variant="h5" paddingTop="0.2em">
              {nip05}
            </Typography>
            <Stack gap={'0.5rem'} marginTop={'0.5em'}>
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

                {isGranted === undefined && (
                  <Typography textAlign={'left'} variant="body2" color={'red'} padding={'1em 0.5em 0.5em 0.5em'}>
                    Your browser does not support notifications! Keep nsec.app tab open for normal operation.
                  </Typography>
                )}
                {isGranted === false && (
                  <Typography textAlign={'left'} variant="body2" padding={'1em 0.5em 0.5em 0.5em'}>
                    You will be asked to <b>enable notifications</b> to allow nsec.app do it's job in the background.
                  </Typography>
                )}

                <GetStartedButton type="submit" disabled={isLoading}>
                  Create account {isLoading && <LoadingSpinner />}
                </GetStartedButton>
              </Stack>

              <Typography textAlign={'left'} variant="h6" paddingTop={'1.5em'}>
                What is Nsec.app?
              </Typography>

              <Typography textAlign={'left'} variant="body1">
                Nsec.app will store your Nostr keys &mdash; your profile, posts and all other actions are signed by
                those keys. Come back to this website when you want to connect your keys to some other apps.
              </Typography>

              {/** FIXME expand from learn-more link to be added above */}

              {/* <Typography textAlign={'left'} variant="h5" paddingTop="1em">
                What you need to know:
              </Typography>

              <ol style={{ marginLeft: '1em' }}>
                <li>Nostr accounts are based on cryptographic keys.</li>
                <li>All your actions on Nostr will be signed by your keys.</li>
                <li>Nsec.app is one of many services to manage Nostr keys.</li>
                <li>When you create an account, a new key will be created.</li>
                <li>This key can later be used with other Nostr websites.</li>
              </ol>
              <LearnMoreButton onClick={handleLearnMore}>Learn more</LearnMoreButton> */}
            </Stack>
          </>
        )}
      </Stack>
      <ModalConfirmConnect />
    </>
  )
}

export default CreatePage
