import React, { FC } from 'react'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { ChangePasswordForm } from './components/ChangePasswordForm/ChangePasswordForm'
import { SetPasswordForm } from './components/SetPasswordForm/SetPasswordForm'

type ModalSetPasswordProps = {
  isSynced: boolean
}

export const ModalSetPassword: FC<ModalSetPasswordProps> = ({ isSynced }) => {
  const { getModalOpened, createHandleCloseBack } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.SET_PASSWORD)
  const handleCloseModal = createHandleCloseBack(MODAL_PARAMS_KEYS.SET_PASSWORD, MODAL_PARAMS_KEYS.SETTINGS)
  const title = isSynced ? 'Change password' : 'Set password'

  return (
    <Modal open={isModalOpened} onClose={handleCloseModal} title={title} withCloseButton={false}>
      {isSynced ? <ChangePasswordForm onClose={handleCloseModal} /> : <SetPasswordForm onClose={handleCloseModal} />}
    </Modal>
  )
}
