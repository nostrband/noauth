import { useCallback, useEffect, useState } from 'react'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { swicCall } from '@/modules/swic'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { CircularProgress, Stack, Typography } from '@mui/material'
import { StyledAppLogo } from './styled'
import { Input } from '@/shared/Input/Input'
import { Button } from '@/shared/Button/Button'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { FormInputType, schema } from './const'
import { yupResolver } from '@hookform/resolvers/yup'
import { DOMAIN } from '@/utils/consts'
import { fetchNip05 } from '@/utils/helpers/helpers'
import { usePassword } from '@/hooks/usePassword'
import { dbi } from '@/modules/db'

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

  const {
    handleSubmit,
    reset,
    register,
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
      const k: any = await swicCall('fetchKey', npub, passphrase, name)
      notify(`Fetched ${k.npub}`, 'success')
      dbi.addSynced(k.npub)
      cleanUpStates()
      navigate(`/key/${k.npub}`)
    } catch (error: any) {
      console.log('error', error)
      notify(error?.message || 'Something went wrong!', 'error')
      setIsLoading(false)
    }
  }

  useEffect(() => {
    return () => {
      if (isModalOpened) {
        // modal closed
        cleanUpStates()
      }
    }
  }, [isModalOpened, cleanUpStates])

  return (
    <Modal open={isModalOpened} onClose={handleCloseModal}>
      <Stack gap={'1rem'} component={'form'} onSubmit={handleSubmit(submitHandler)}>
        <Stack direction={'row'} gap={'1rem'} alignItems={'center'} alignSelf={'flex-start'}>
          <StyledAppLogo />
          <Typography fontWeight={600} variant="h5">
            Login
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
        />
        <Button type="submit" fullWidth disabled={isLoading}>
          Add account {isLoading && <CircularProgress sx={{ marginLeft: '0.5rem' }} size={'1rem'} />}
        </Button>
      </Stack>
    </Modal>
  )
}
