import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import React from 'react'

export const ModalSetPassword = () => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.SET_PASSWORD)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.SET_PASSWORD)

  return <div>ModalSetPassword</div>
}
