import { FC } from 'react'
import { Stack } from '@mui/material'
import { Button } from '@/shared/Button/Button'
import { Modal } from '@/shared/Modal/Modal'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { StyledSubtitle } from './styled'
import { client } from '@/modules/client'
import { useNavigate } from 'react-router-dom'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'

type ModalConfirmLogoutSettings = {
  npub: string
}

export const ModalConfirmLogout: FC<ModalConfirmLogoutSettings> = ({ npub }) => {
  const navigate = useNavigate()
  const notify = useEnqueueSnackbar()
  const { getModalOpened, createHandleCloseBack } = useModalSearchParams()
  const handleClose = createHandleCloseBack(MODAL_PARAMS_KEYS.CONFIRM_LOGOUT, MODAL_PARAMS_KEYS.SETTINGS)
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.CONFIRM_LOGOUT)

  const handleConfirmLogout = async () => {
    try {
      await client.deleteKey(npub)
      navigate(`/home/`)
    } catch (error: any) {
      notify('Failed to log out: ' + error.toString(), 'error')
    }
  }
  return (
    <Modal open={isModalOpened} onClose={handleClose} title="Are you sure?" withCloseButton={false}>
      <Stack gap={'1rem'}>
        <StyledSubtitle>
          Your key will be removed from this device. Please make sure you remember your password or have a backup of the
          key.
        </StyledSubtitle>
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
