import { FC, useState } from 'react'
import { MODAL_STEPS, ModalStep } from './utils'
import { StepSavePassword } from './components/StepSavePassword/StepSavePassword'
import { StepBackupKeys } from './components/StepBackupKeys/StepBackupKeys'
import { StepFinishSignUp } from './components/StepFinishSignUp/StepFinishSignUp'
import { FormInputType } from './const'
import { usePassword } from '@/hooks/usePassword'
import { client } from '@/modules/client'
import { useParams, useSearchParams } from 'react-router-dom'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { useUnmount } from 'usehooks-ts'

type ModalCompleteSignUpContentProps = {
  currentStep: ModalStep
  onChangeStep: (newStep: ModalStep) => void
  onClose: () => void
}

export const ModalCompleteSignUpContent: FC<ModalCompleteSignUpContentProps> = ({
  currentStep,
  onChangeStep,
  onClose,
}) => {
  const notify = useEnqueueSnackbar()

  const { npub = '' } = useParams<{ npub: string }>()
  const [searchParams] = useSearchParams()
  const emailCode = searchParams.get('code') || ''

  const { hidePassword, inputProps } = usePassword()

  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (values: FormInputType) => {
    try {
      if (!emailCode || isLoading) return

      setIsLoading(true)
      hidePassword()
      const { email, password } = values

      await client.confirmEmail(npub, email, emailCode, password)
      setIsLoading(false)
      notify('Your e-mail has been successfully confirmed!', 'error')

      onChangeStep(MODAL_STEPS[1])
    } catch (error: any) {
      notify('Error ' + error.toString(), 'error')
      setIsLoading(false)
    }
  }

  useUnmount(() => {
    console.log("useUnmount");
    onChangeStep(MODAL_STEPS[0])
    onClose()
    hidePassword()
  })

  console.log("render", currentStep);
  if (currentStep === 'password') {
    return <StepSavePassword onSubmit={handleSubmit} isLoading={isLoading} inputProps={inputProps} />
  }

  if (currentStep === 'backup') {
    return <StepBackupKeys npub={npub} onChangeStep={onChangeStep} />
  }

  if (currentStep === 'finish') {
    return <StepFinishSignUp onClose={onClose} />
  }

  return null
}
