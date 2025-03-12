import { useCallback, useEffect, useState } from 'react'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Stack, Typography } from '@mui/material'
import { Input } from '@/shared/Input/Input'
import { Button } from '@/shared/Button/Button'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FormInputType, schema } from './const'
import { yupResolver } from '@hookform/resolvers/yup'
import { DOMAIN } from '@/utils/consts'
import { fetchNpubNames } from '@/utils/helpers/helpers'
import { usePassword } from '@/hooks/usePassword'
import { LoadingSpinner } from '@/shared/LoadingSpinner/LoadingSpinner'
import { fetchNip05 } from '@noauth/common'
import { client } from '@/modules/client'

const FORM_DEFAULT_VALUES = {
  username: '',
  password: '',
}

export const ModalLogin = () => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.LOGIN)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.LOGIN)

  const notify = useEnqueueSnackbar()
  const navigate = useNavigate()
  const { hidePassword, inputProps } = usePassword()
  const [isLoading, setIsLoading] = useState(false)
  const [searchParams] = useSearchParams()
  const isPopup = searchParams.get('popup') === 'true'

  const {
    handleSubmit,
    reset,
    register,
    setValue,
    formState: { errors },
  } = useForm<FormInputType>({
    defaultValues: FORM_DEFAULT_VALUES,
    resolver: yupResolver(schema),
    mode: 'onSubmit',
  })

  const cleanUpStates = useCallback(() => {
    hidePassword()
    reset()
    setIsLoading(false)
  }, [reset, hidePassword])

  const submitHandler = async (values: FormInputType) => {
    hidePassword()
    if (isLoading) return undefined

    try {
      setIsLoading(true)
      let npub = values.username
      let name = ''

      if (!npub.startsWith('npub1')) {
        name = npub
        if (!npub.includes('@')) {
          npub += '@' + DOMAIN
        } else {
          const nameDomain = npub.split('@')
          if (nameDomain[1] === DOMAIN) name = nameDomain[0]
        }
      }
      if (npub.includes('@')) {
        const npubNip05 = await fetchNip05(npub)
        if (!npubNip05) throw new Error(`Username ${npub} not found`)
        npub = npubNip05
      }
      const passphrase = values.password

      console.log('fetch', npub, name)
      const k = await client.fetchKey(npub, passphrase, name)

      // FIXME implement 2FA - email or OTP
      if (!k) throw new Error("2FA required");

      notify(`Fetched ${k.npub}`, 'success')
      cleanUpStates()
      setTimeout(() => {
        // give frontend time to read the new key first
        navigate(`/key/${k.npub}${isPopup ? '?popup=true' : ''}`)
      }, 300)
    } catch (error: any) {
      console.log('error', error)
      notify(error?.message || 'Something went wrong!', 'error')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isModalOpened) {
      const npub = searchParams.get('npub') || ''
      if (isPopup && isModalOpened) {
        // ask backend to pre-fetch pending reqs
        client.fetchPendingRequests(npub)
        fetchNpubNames(npub).then((names) => {
          if (names.length) {
            setValue('username', `${names[0]}@${DOMAIN}`)
          }
        })
      }
    }
  }, [searchParams, isModalOpened, isPopup, setValue])

  useEffect(() => {
    return () => {
      if (isModalOpened) {
        // modal closed
        cleanUpStates()
      }
    }
  }, [isModalOpened, cleanUpStates])

  return (
    <Modal open={isModalOpened} onClose={handleCloseModal} withCloseButton={false}>
      <Stack paddingTop={'1rem'} gap={'1rem'} component={'form'} onSubmit={handleSubmit(submitHandler)}>
        <Stack gap={'0.2rem'} padding={'0 1rem'} alignSelf={'flex-start'}>
          <Typography fontWeight={600} variant="h5">
            Login
          </Typography>
          <Typography noWrap variant="body2" color={'GrayText'}>
            Sync keys from the cloud to this device
          </Typography>
        </Stack>
        <Input
          label="Username or nip05 or npub"
          fullWidth
          placeholder="name or name@domain.com or npub1..."
          {...register('username')}
          error={!!errors.username}
        />
        <Input
          label="Password"
          fullWidth
          placeholder="Your password"
          {...register('password')}
          {...inputProps}
          error={!!errors.password}
          // helperText={'Password you set in Cloud Sync settings'}
        />

        <Stack gap={'0.5rem'}>
          <Button type="submit" fullWidth disabled={isLoading}>
            Login {isLoading && <LoadingSpinner />}
          </Button>
        </Stack>
      </Stack>
    </Modal>
  )
}
