import { FC } from 'react'
import { Modal } from '@/shared/Modal/Modal'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { ModalActivitiesContent } from './ModalActivitiesContent'

type ModalActivitiesProps = {
  appNpub: string
}

export const ModalActivities: FC<ModalActivitiesProps> = ({ appNpub }) => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.ACTIVITY)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.ACTIVITY)

  return (
    <Modal open={isModalOpened} onClose={handleCloseModal} fixedHeight="calc(100% - 5rem)" title="Activity history">
      <ModalActivitiesContent appNpub={appNpub} />
    </Modal>
  )
}
