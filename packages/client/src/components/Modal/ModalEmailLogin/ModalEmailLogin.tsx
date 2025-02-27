import { useState } from 'react'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
// import { useNavigate } from 'react-router-dom'
import { FormProvider, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { usePassword } from '@/hooks/usePassword'
import { FormInputType, schema } from './const'
import { ModalEmailLoginContent } from './ModalEmailLoginContent'

const FORM_DEFAULT_VALUES = {
  username: '',
  password: '',
}

export const ModalEmailLogin = () => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.EMAIL_LOGIN)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.EMAIL_LOGIN)

  const notify = useEnqueueSnackbar()
  // const navigate = useNavigate()

  const { hidePassword, inputProps } = usePassword()
  const [isLoading, setIsLoading] = useState(false)

  const methods = useForm<FormInputType>({
    defaultValues: FORM_DEFAULT_VALUES,
    resolver: yupResolver(schema),
    mode: 'onSubmit',
  })

  const cleanUpStates = () => {
    hidePassword()
    methods.reset()
    setIsLoading(false)
  }

  const submitHandler = async (values: FormInputType) => {
    hidePassword()
    setIsLoading(false)

    if (isLoading) return

    console.log(values)

    try {
      setIsLoading(true)
    } catch (error: any) {
      console.log('error', error)
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
