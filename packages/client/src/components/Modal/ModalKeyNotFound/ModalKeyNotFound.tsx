import { FC } from 'react'
import { Modal } from '@/shared/Modal/Modal'
import { ModalKeyNotFoundContent } from './ModalKeyNotFoundContent'

type ModalKeyNotFoundProps = {
  open: boolean
  onClose: () => void
}

export const ModalKeyNotFound: FC<ModalKeyNotFoundProps> = ({ open, onClose }) => {
  return (
    <Modal open={open} title={'Key not found'} onClose={onClose}>
      <ModalKeyNotFoundContent onClose={onClose} />
    </Modal>
  )
}
