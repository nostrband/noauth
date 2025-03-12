import { useEffect, useState } from 'react'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { FormProvider, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { usePassword } from '@/hooks/usePassword'
import { FormInputType, schema } from './const'
import { ModalEmailLoginContent } from './ModalEmailLoginContent'
import { client } from '@/modules/client'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { parseNostrConnectMeta } from '@/utils/helpers/helpers'

export const ModalEmailLogin = () => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.EMAIL_LOGIN)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.EMAIL_LOGIN, {
    onClose: (sp) => {
      sp.delete('connect')
      sp.delete('email')
    },
  })

  const navigate = useNavigate()
  const notify = useEnqueueSnackbar()
  const [searchParams] = useSearchParams()
  const nostrconnect = searchParams.get('connect') || ''
  const email = searchParams.get('email') || ''

  const { hidePassword, inputProps } = usePassword()
  const [isLoading, setIsLoading] = useState(false)

  const methods = useForm<FormInputType>({
    defaultValues: { email: '', password: '' },
    resolver: yupResolver(schema),
    mode: 'onSubmit',
  })

  useEffect(() => {
    methods.setValue('email', email)
    // eslint-disable-next-line
  }, [email])

  const cleanUpStates = () => {
    hidePassword()
    methods.reset()
    setIsLoading(false)
  }

  const submitHandler = async (values: FormInputType) => {
    try {
      hidePassword()
      setIsLoading(false)
      if (isLoading) return
      if (!nostrconnect || !nostrconnect.startsWith('nostrconnect://')) return

      setIsLoading(true)
      const { email, password } = values
      const nostrconnectURL = new URL(nostrconnect)

      const checkEmail = await client.checkName(email)

      const key = checkEmail.startsWith('npub')
        ? await client.fetchKey(checkEmail, password, email.split('@')[0])
        : await client.fetchKeyByEmail(email, password)

      if (!key) {
        setIsLoading(false)
        throw new Error('No key found!')
      }
      const meta = parseNostrConnectMeta(nostrconnectURL.search)
      if (!meta) return setIsLoading(false)

      const { npub } = key
      const requestId = await client.nostrConnect(npub, nostrconnect, {
        appName: meta.appName,
        appUrl: meta.appUrl,
        appIcon: meta.appIcon,
        perms: meta.perms,
      })
      setIsLoading(false)

      if (!requestId) {
        notify('App connected! Closing...', 'success')
        // if (isPopup) setTimeout(() => closePopup(), 3000)
        navigate(`/key/${npub}`, { replace: true })
      } else {
        return navigate(`/key/${npub}?confirm-connect=true&reqId=${requestId}&popup=true`)
      }
    } catch (error: any) {
      notify(error?.message || 'Something went wrong!', 'error')
      setIsLoading(false)
    }
  }

  return (
    <Modal open={isModalOpened} onClose={handleCloseModal} withCloseButton={false}>
      <FormProvider {...methods}>
        <ModalEmailLoginContent
          inputProps={inputProps}
          isLoading={isLoading}
          onSubmit={submitHandler}
          onUnmount={cleanUpStates}
        />
      </FormProvider>
    </Modal>
  )
}
