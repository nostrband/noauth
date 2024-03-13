import { useCallback, useState } from 'react'
import { useAppSelector } from '../../store/hooks/redux'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { Box, IconButton, Stack } from '@mui/material'
import { StyledIconButton } from './styled'
import { SettingsIcon, ShareIcon } from '@/assets'
import { Apps } from './components/Apps'
import { ModalConnectApp } from '@/components/Modal/ModalConnectApp/ModalConnectApp'
import { useModalSearchParams } from '@/hooks/useModalSearchParams'
import { EXPLANATION_MODAL_KEYS, MODAL_PARAMS_KEYS } from '@/types/modal'
import { ModalSettings } from '@/components/Modal/ModalSettings/ModalSettings'
import { ModalExplanation } from '@/components/Modal/ModalExplanation/ModalExplanation'
import { ModalConfirmConnect } from '@/components/Modal/ModalConfirmConnect/ModalConfirmConnect'
import { ModalConfirmEvent } from '@/components/Modal/ModalConfirmEvent/ModalConfirmEvent'
import { useBackgroundSigning } from './hooks/useBackgroundSigning'
import { BackgroundSigningWarning } from './components/BackgroundSigningWarning'
import UserValueSection from './components/UserValueSection'
import { useTriggerConfirmModal } from './hooks/useTriggerConfirmModal'
import { useLiveQuery } from 'dexie-react-hooks'
import { checkNpubSyncQuerier } from './utils'
import { DOMAIN } from '@/utils/consts'
import { InputCopyButton } from '@/shared/InputCopyButton/InputCopyButton'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import { ModalEditName } from '@/components/Modal/ModalEditName/ModalEditName'
import { ModalSetPassword } from '@/components/Modal/ModalSetPassword/ModalSetPassword'

const KeyPage = () => {
  const { npub = '' } = useParams<{ npub: string }>()
  const { keys, apps, pending, perms } = useAppSelector((state) => state.content)
  const [searchParams] = useSearchParams()

  const [isCheckingSync, setIsChecking] = useState(true)
  const handleStopChecking = () => setIsChecking(false)

  const isSynced = useLiveQuery(checkNpubSyncQuerier(npub, handleStopChecking), [npub], false)

  const { handleOpen } = useModalSearchParams()
  const { handleEnableBackground, showWarning, isEnabling } = useBackgroundSigning()

  const key = keys.find((k) => k.npub === npub)
  const isPasswordSet = !!key?.ncryptsec

  const getUsername = useCallback(() => {
    if (!key || !key?.name) return ''
    if (key.name.includes('@')) return key.name
    return `${key?.name}@${DOMAIN}`
  }, [key])
  const username = getUsername()

  const filteredApps = apps.filter((a) => a.npub === npub)
  useTriggerConfirmModal(npub, pending, perms)

  const isKeyExists = npub.trim().length && key
  const isPopup = searchParams.get('popup') === 'true'

  if (isPopup && !isKeyExists) {
    searchParams.set('login', 'true')
    searchParams.set('npub', npub)
    const url = `/home?${searchParams.toString()}`
    return <Navigate to={url} />
  }

  if (!isKeyExists) return <Navigate to={`/home`} />

  const handleOpenConnectAppModal = () => handleOpen(MODAL_PARAMS_KEYS.CONNECT_APP)
  const handleOpenSettingsModal = () => handleOpen(MODAL_PARAMS_KEYS.SETTINGS)
  const handleOpenEditNameModal = () => handleOpen(MODAL_PARAMS_KEYS.EDIT_NAME)

  return (
    <>
      <Stack gap={'1rem'} height={'100%'}>
        {showWarning && (
          <BackgroundSigningWarning isEnabling={isEnabling} onEnableBackSigning={handleEnableBackground} />
        )}
        <UserValueSection
          title="Your login"
          value={username}
          endAdornment={
            <Box display={'flex'} alignItems={'center'} gap={'0.25rem'}>
              <IconButton onClick={handleOpenEditNameModal} color={username ? 'default' : 'error'}>
                <MoreHorizRoundedIcon />
              </IconButton>
              <InputCopyButton value={username} />
            </Box>
          }
          explanationType={EXPLANATION_MODAL_KEYS.LOGIN}
        />
        <UserValueSection
          title="Your NPUB"
          value={npub}
          endAdornment={<InputCopyButton value={npub} />}
          explanationType={EXPLANATION_MODAL_KEYS.NPUB}
        />

        <Stack direction={'row'} gap={'0.75rem'}>
          <StyledIconButton onClick={handleOpenConnectAppModal}>
            <ShareIcon />
            Connect app
          </StyledIconButton>

          <StyledIconButton
            bgcolor_variant="secondary"
            onClick={handleOpenSettingsModal}
            withBadge={!isCheckingSync && !isSynced}
          >
            <SettingsIcon />
            Settings
          </StyledIconButton>
        </Stack>

        <Apps apps={filteredApps} npub={npub} />
      </Stack>

      <ModalConnectApp />
      <ModalSettings isSynced={isSynced} />
      <ModalExplanation />
      <ModalConfirmConnect />
      <ModalConfirmEvent />
      <ModalEditName />
      <ModalSetPassword isPasswordSet={isPasswordSet} />
    </>
  )
}

export default KeyPage
