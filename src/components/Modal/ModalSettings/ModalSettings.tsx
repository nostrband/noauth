import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { Modal } from '@/shared/Modal/Modal'
import { MODAL_PARAMS_KEYS } from '@/types/modal'
import { Stack } from '@mui/material'
import { FC } from 'react'
import { useParams } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks/redux'
import { selectKeys } from '@/store'
import { ExportKeySetting } from './components/ExportKeySetting'
import { PasswordSetting } from './components/PasswordSetting'

type ModalSettingsProps = {
  isSynced: boolean
}

export const ModalSettings: FC<ModalSettingsProps> = ({ isSynced }) => {
  const { getModalOpened, createHandleCloseReplace } = useModalSearchParams()
  const { npub = '' } = useParams<{ npub: string }>()
  const keys = useAppSelector(selectKeys)

  const isModalOpened = getModalOpened(MODAL_PARAMS_KEYS.SETTINGS)
  const handleCloseModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.SETTINGS)

  const isNpubExists = npub.trim().length && keys.some((key) => key.npub === npub)

  if (isModalOpened && !isNpubExists) {
    handleCloseModal()
    return null
  }

  const onClose = () => handleCloseModal()

  return (
    <Modal open={isModalOpened} onClose={onClose} title="Settings">
      <Stack gap={'1rem'}>
        <PasswordSetting isSynced={isSynced} />
        <ExportKeySetting />
      </Stack>
    </Modal>
  )
}
