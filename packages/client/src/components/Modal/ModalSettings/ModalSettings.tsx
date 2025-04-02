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
import { Button } from '@/shared/Button/Button'
import { SecureEnclaveSetting } from './components/SecureEnclaveSetting'

type ModalSettingsProps = {
  isSynced: boolean
  onLogout: () => void
}

export const ModalSettings: FC<ModalSettingsProps> = ({ isSynced, onLogout }) => {
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

  return (
    <>
      <Modal open={isModalOpened} onClose={handleCloseModal} title="Settings" withCloseButton={false}>
        <Stack gap={'1rem'}>
          <PasswordSetting isSynced={isSynced} />
          <ExportKeySetting />
          <SecureEnclaveSetting />
          <Button type="button" varianttype="secondary" onClick={onLogout}>
            Log out
          </Button>
          <Button type="button" onClick={handleCloseModal}>
            Done
          </Button>
        </Stack>
      </Modal>
    </>
  )
}
