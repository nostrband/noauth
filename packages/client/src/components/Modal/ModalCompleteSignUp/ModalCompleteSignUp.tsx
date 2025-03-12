import { FC, useState } from 'react'
import { Modal } from '@/shared/Modal/Modal'
import { ModalCompleteSignUpContent } from './ModalCompleteSignUpContent'
import { getModalTitle, MODAL_STEPS, ModalStep } from './utils'
import { useNavigate, useParams } from 'react-router-dom'

export const ModalCompleteSignUp: FC = () => {
  const { npub = '' } = useParams<{ npub: string }>()
  const navigate = useNavigate()

  const handleClose = () => {
    navigate(`/key/${npub}`, { replace: true })
  }

  const [currentStep, setCurrentStep] = useState(MODAL_STEPS[0])

  const title = getModalTitle(currentStep)
  console.log('complete signup', currentStep, title)

  const handleChangeStep = (newStep: ModalStep) => {
    setCurrentStep(newStep)
  }

  return (
    <Modal open title={title} onClose={handleClose}>
      <ModalCompleteSignUpContent currentStep={currentStep} onChangeStep={handleChangeStep} onClose={handleClose} />
    </Modal>
  )
}
