import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Button } from '@/shared/Button/Button'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Stack } from '@mui/material'

export const ModalInitial = () => {
  const { getModalOpened, createHandleCloseReplace, handleOpen } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.INITIAL)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.INITIAL)

  return (
    <Modal open={isModalOpened} onClose={handleCloseModal}>
      <Stack paddingTop={'0.5rem'} gap={'1rem'}>
        <Button onClick={() => handleOpen(MODAL_PARAMS_KEYS.SIGN_UP)}>Sign up</Button>
        <Button onClick={() => handleOpen(MODAL_PARAMS_KEYS.LOGIN)}>Login</Button>
        <Button onClick={() => handleOpen(MODAL_PARAMS_KEYS.IMPORT_KEYS)}>Import key</Button>
      </Stack>
    </Modal>
  )
}
