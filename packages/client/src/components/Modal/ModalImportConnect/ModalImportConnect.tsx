import { FC, useCallback, useEffect, useState } from 'react'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { Modal } from '@/shared/Modal/Modal'
import { Avatar, Stack, Typography } from '@mui/material'
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getPublicKey, nip19 } from 'nostr-tools'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { useProfile } from '@/hooks/useProfile'
import { Container, HeadingContainer, InputsContainer, StyledText, Subtitle } from './styled'
import { Input } from '@/shared/Input/Input'
import { PasswordValidationStatus } from '@/shared/PasswordValidationStatus/PasswordValidationStatus'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { FormInputType, schema } from './utils/const'
import { usePassword } from '@/hooks/usePassword'
import { usePasswordValidation } from '@/hooks/usePasswordValidation'
import { Button } from '@/shared/Button/Button'
import { client } from '@/modules/client'
import useIframePort from '@/hooks/useIframePort'
import { parseNostrConnectMeta } from '../ModalNostrConnect/utils/helpers'

const FORM_DEFAULT_VALUES = {
  password: '',
  rePassword: '',
}

const IMPORT_HASH_KEY = 'import'

export const ModalImportConnect: FC = () => {
  const navigate = useNavigate()
  const notify = useEnqueueSnackbar()
  const { pubkey: appPubkey = '' } = useParams()
  const [searchParams] = useSearchParams()
  const { hash } = useLocation()

  const parsedHash = new URLSearchParams(hash.substring(1))
  const newNsec = parsedHash.get(IMPORT_HASH_KEY)
  const [nsec, setNsec] = useState(newNsec)

  const [pubkey, setPubkey] = useState('')
  const [isFetchingProfile, setIsFetchingProfile] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const npub = pubkey ? nip19.npubEncode(pubkey) : ''
  const { profile, avatarTitle, userAvatar, userName } = useProfile(npub)

  const userNip05 = profile?.info?.nip05 || npub

  const {
    handleSubmit,
    reset,
    register,
    formState: { errors },
    watch,
  } = useForm<FormInputType>({
    defaultValues: FORM_DEFAULT_VALUES,
    resolver: yupResolver(schema),
    mode: 'onChange',
  })

  const enteredPassword = watch('password') || ''

  const { hidePassword, inputProps } = usePassword()
  const { hidePassword: hideRePassword, inputProps: rePasswordInputProps } = usePassword()
  const { isPasswordInvalid, passwordStrength, reset: resetPasswordValidation } = usePasswordValidation(enteredPassword)

  const meta = parseNostrConnectMeta('?' + searchParams.toString());

  // default
  const isPopup = true // searchParams.get('popup') === 'true'

  // let this modal accept the iframe port to pass it
  // down to ConfirmConnect modal later on
  useIframePort(isPopup)

  useEffect(() => {
    const getNpub = () => {
      if (!newNsec) return

      try {
        const { type, data } = nip19.decode(newNsec)
        if (type !== 'nsec') {
          navigate('/home')
          return notify('Invalid nsec!', 'error')
        }
        setPubkey(getPublicKey(data as string))
        setNsec(newNsec)
        setIsFetchingProfile(false)

        // make sure the nsec is hidden from the url bar
        navigate(window.location.pathname + window.location.search, { replace: true })
      } catch {
        notify('Invalid nsec!', 'error')
        navigate('/home')
      }
    }
    getNpub()
  }, [navigate, notify, newNsec])

  const handleClose = () => {
    navigate('/home')
  }

  const cleanUpStates = useCallback(() => {
    hidePassword()
    hideRePassword()
    reset()
    resetPasswordValidation()
    setIsLoading(false)
  }, [hidePassword, hideRePassword, reset, resetPasswordValidation])

  const closePopup = () => {
    if (isPopup) return window.close()
  }

  const submitHandler = async (values: FormInputType) => {
    if (!nsec || !meta) return
    hidePassword()
    hideRePassword()
    // console.log({ values, userNip05, nsec }, 'HISH')
    if (isLoading || isPasswordInvalid) return undefined
    try {
      setIsLoading(true)

      const { password } = values
      if (!password.trim() || !userNip05 || !nsec.trim()) throw new Error('Fill out all fields!')

      await client.importKey(userNip05, nsec.trim(), password.trim())

      const nostrconnect = `nostrconnect://${appPubkey}?${searchParams.toString()}`
      const requestId = await client.nostrConnect(npub, nostrconnect, {
        appName: meta.appName,
        appUrl: meta.appUrl,
        appIcon: meta.appIcon,
        perms: meta.perms,
      })

      if (!requestId) {
        notify('App connected! Closing...', 'success')
        if (isPopup) setTimeout(() => closePopup(), 3000)
        else navigate(`/key/${npub}`, { replace: true })
      } else {
        return navigate(`/key/${npub}?confirm-connect=true&reqId=${requestId}&popup=true`, { replace: true })
      }
      cleanUpStates()
    } catch (error: any) {
      notify(error?.message || 'Something went wrong!', 'error')
      cleanUpStates()
    }
  }

  if (!appPubkey || !meta || !nsec) {
    return <Navigate to={'/'} />
  }

  return (
    <Modal open onClose={handleClose}>
      {isFetchingProfile ? (
        <Stack alignItems={'center'} justifyContent={'center'} height={'100%'}>
          <LoadingSpinner mode="secondary" size={'2rem'} />
        </Stack>
      ) : (
        <Container component={'form'} onSubmit={handleSubmit(submitHandler)}>
          <HeadingContainer>
            <Typography fontWeight={600} variant="h5">
              Import key
            </Typography>
            <Subtitle>Importing Nostr keys for this profile:</Subtitle>
          </HeadingContainer>

          <Stack direction={'row'} alignItems={'center'} gap="1rem" px={'0.5rem'}>
            <Avatar src={userAvatar} alt={userName} sx={{ width: 50, height: 50 }}>
              {avatarTitle}
            </Avatar>
            <Stack flex={1} overflow={'hidden'}>
              <StyledText fontWeight={600} fontSize={'1.25rem'}>
                {userName}
              </StyledText>
              {profile && (
                <StyledText variant="body2" color={'GrayText'}>
                  {npub}
                </StyledText>
              )}
            </Stack>
          </Stack>

          <HeadingContainer>
            <Typography fontWeight={600} variant="h6">
              Protect your keys
            </Typography>
            <Subtitle>
              The keys are stored on your devices. Set a password that will be used to encrypt your keys and to sync
              through the cloud.
            </Subtitle>
          </HeadingContainer>

          <InputsContainer>
            <input
              type="text"
              id="username"
              hidden
              autoComplete="username"
              onChange={() => undefined}
              value={userNip05}
            />
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
              {...rePasswordInputProps}
              placeholder="Confirm password"
              autoComplete="confirm-password"
              id="confirm-password"
            />
            {!errors.rePassword?.message && (
              <PasswordValidationStatus
                isImport={true}
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

          <Button type="submit">Continue {isLoading && <LoadingSpinner />}</Button>
          <Button varianttype="secondary" type="button" disabled={!nsec}>
            Cancel
          </Button>
        </Container>
      )}
    </Modal>
  )
}
