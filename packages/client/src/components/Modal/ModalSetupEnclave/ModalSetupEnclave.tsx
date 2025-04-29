import React from 'react'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { ModalSetupEnclaveContent } from './ModalSetupEnclaveContent'
import { useSearchParams } from 'react-router-dom'

export const ModalSetupEnclave = () => {
  const [searchParams] = useSearchParams()
  const openedByBadge = searchParams.get('mode') === 'badge'

  const { getModalOpened, createHandleCloseBack, createHandleClose } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.ENCLAVE_SETUP)
  const handleClose = openedByBadge
    ? createHandleClose(MODAL_PARAMS_KEYS.ENCLAVE_SETUP)
    : createHandleCloseBack(MODAL_PARAMS_KEYS.ENCLAVE_SETUP, MODAL_PARAMS_KEYS.SETTINGS)

  return (
    <Modal open={isModalOpened} title="Setup secure enclave" onClose={handleClose}>
      <ModalSetupEnclaveContent onClose={handleClose} />
    </Modal>
  )
}
