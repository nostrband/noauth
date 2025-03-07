import React, { FC, useState } from 'react'
import { Modal } from '@/shared/Modal/Modal'
import { ModalCompleteSignUpContent } from './ModalCompleteSignUpContent'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { getModalTitle, MODAL_STEPS, ModalStep } from './utils'
import { useNavigate, useParams } from 'react-router-dom'

export const ModalCompleteSignUp: FC = () => {
  const { npub = '' } = useParams<{ npub: string }>()
  const navigate = useNavigate()

  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.CONFIRM_EMAIL)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.CONFIRM_EMAIL)

  const handleClose = () => {
    handleCloseModal()
    navigate(`/key/${npub}`)
  }

  const [currentStep, setCurrentStep] = useState(MODAL_STEPS[2])

  const title = getModalTitle(currentStep)

  const handleChangeStep = (newStep: ModalStep) => {
    setCurrentStep(newStep)
  }

  return (
    <Modal open={isModalOpened} title={title}>
      <ModalCompleteSignUpContent currentStep={currentStep} onChangeStep={handleChangeStep} onClose={handleClose} />
    </Modal>
  )
}
