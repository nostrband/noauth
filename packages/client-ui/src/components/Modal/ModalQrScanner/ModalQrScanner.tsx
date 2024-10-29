import { FC } from 'react'
import { ModalQrScannerContent } from './components/ModalQrScannerContent'
import { Modal } from '@/shared/Modal/Modal'

type ModalQrScannerProps = {
  open: boolean
  onClose: () => void
  onScanSuccess: (data: string) => void
}

export const ModalQrScanner: FC<ModalQrScannerProps> = ({ open, onClose, onScanSuccess }) => {
  return (
    <Modal open={open} onClose={onClose} title="Scan QR" fixedHeight="calc(100%) - 2rem">
      <ModalQrScannerContent onCancel={onClose} onScanSuccess={onScanSuccess} />
    </Modal>
  )
}
