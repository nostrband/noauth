import { FC } from 'react'
import { Stack } from '@mui/material'
import { Button } from '@/shared/Button/Button'
import { Modal } from '@/shared/Modal/Modal'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { StyledSubtitle } from './styled'

export const ModalConfirmLogout: FC = () => {
  const { getModalOpened, createHandleCloseBack } = useModalSearchParams()
  const handleClose = createHandleCloseBack(MODAL_PARAMS_KEYS.CONFIRM_LOGOUT, MODAL_PARAMS_KEYS.SETTINGS)
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.CONFIRM_LOGOUT)

  const handleConfirmLogout = () => {
    // delete_key(npub)
  }
  return (
    <Modal open={isModalOpened} onClose={handleClose} title="Are you sure?" withCloseButton={false}>
      <Stack gap={'1rem'}>
        <StyledSubtitle>This action will terminate all applications bound to your key</StyledSubtitle>
        <Button type="button" varianttype="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button type="button" onClick={handleConfirmLogout}>
          Log out
        </Button>
      </Stack>
    </Modal>
  )
}
