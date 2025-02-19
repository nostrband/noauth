import { FC } from 'react'
import { Modal } from '@/shared/Modal/Modal'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Stack } from '@mui/material'
import { NewRelayForm } from './components/NewRelayForm'
import { RelaysList } from './components/RelaysList'
import { Button } from '@/shared/Button/Button'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'

export const ModalRelays: FC = () => {
  const notify = useEnqueueSnackbar()

  const { getModalOpened, createHandleCloseBack } = useModalSearchParams()
  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.RELAYS)
  const handleCloseModal = createHandleCloseBack(MODAL_PARAMS_KEYS.RELAYS, MODAL_PARAMS_KEYS.SETTINGS)

  const handleDeleteRelay = async (relay: string) => {
    try {
      console.log(relay)
    } catch (error: any) {
      notify('Failed to remove relay: ' + error.toString(), 'error')
    }
  }

  const handleAddRelay = async (relay: string) => {
    try {
      if (!relay.startsWith('wss://')) {
        throw new Error('Invalid relay!')
      }
      console.log(relay)
    } catch (error: any) {
      notify('Failed to add relay: ' + error.toString(), 'error')
    }
  }

  return (
    <Modal open={isModalOpened} onClose={handleCloseModal} title="Settings" withCloseButton={false}>
      <Stack gap={'1rem'}>
        <NewRelayForm onSubmit={handleAddRelay} />
        <RelaysList onDeleteRelay={handleDeleteRelay} />
        <Button type="button" onClick={handleCloseModal}>
          Done
        </Button>
      </Stack>
    </Modal>
  )
}
