import { FC, memo } from 'react'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { ModalSigningUpContent } from './ModalSigningUpContent'

export const ModalSigningUp: FC = memo(() => {
  const { getModalOpened } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.SIGNING_UP)

  return (
    <Modal open={isModalOpened} withCloseButton={false} title="Signing up">
      <ModalSigningUpContent />
    </Modal>
  )
})
