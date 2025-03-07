import { useCallback, useEffect, useState } from 'react'
import { useAppSelector } from '../../store/hooks/redux'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import { Box, IconButton, Stack } from '@mui/material'
import { StyledIconButton } from './styled'
import { SettingsIcon, ShareIcon } from '@/assets'
import { Apps } from './components/Apps/Apps'
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
import { DOMAIN } from '@/utils/consts'
import { InputCopyButton } from '@/shared/InputCopyButton/InputCopyButton'
import MoreHorizRoundedIcon from '@mui/icons-material/MoreHorizRounded'
import { ModalEditName } from '@/components/Modal/ModalEditName/ModalEditName'
import { ModalSetPassword } from '@/components/Modal/ModalSetPassword/ModalSetPassword'
import { client } from '@/modules/client'
import { ModalRebind } from '@/components/Modal/ModalRebind/ModalRebind'
import { ModalConfirmLogout } from '@/components/Modal/ModalConfirmLogout/ModalConfirmLogout'
import { EmailConfirmationWarning } from './components/EmailConfirmationWarning'
import { useEmailConfirmation } from './hooks/useEmailConfirmation'
import { selectKeyByNpub } from '@/store'

const KeyPage = () => {
  const { npub = '' } = useParams<{ npub: string }>()
  const [searchParams] = useSearchParams()

  const key = useAppSelector((state) => selectKeyByNpub(state, npub))
  const { pending, perms } = useAppSelector((state) => state.content)

  const [isSynced, setIsSynced] = useState(false)
  const [isCheckingSync, setIsChecking] = useState(true)
  const handleStopChecking = () => setIsChecking(false)

  const { handleOpen, createHandleCloseReplace } = useModalSearchParams()
  const handleCloseSettingsModal = createHandleCloseReplace(MODAL_PARAMS_KEYS.SETTINGS)

  const { handleEnableBackground, showWarning, isEnabling } = useBackgroundSigning()

  const { email = '', ncryptsec } = key || {}
  const isPasswordSet = !!ncryptsec

  const { handleResendConfirmation, showWarning: showEmailWarning, isLoading } = useEmailConfirmation(key)

  const getUsername = useCallback(() => {
    if (!key || !key?.name) return ''
    if (key.name.includes('@')) return key.name
    return `${key?.name}@${DOMAIN}`
  }, [key])
  const username = getUsername()

  useTriggerConfirmModal(npub, pending, perms)

  const isKeyExists = npub.trim().length && key
  const isPopup = searchParams.get('popup') === 'true'

  useEffect(() => {
    const load = async () => {
      const synced = await client.getSynced(npub)
      setIsSynced(synced)
      handleStopChecking()
    }
    load()
    // eslint-disable-next-line
  }, [npub])

  if (isPopup && !isKeyExists) {
    searchParams.set('login', 'true')
    searchParams.set('npub', npub)
    const url = `/home?${searchParams.toString()}`
    return <Navigate to={url} replace />
  }

  if (!isKeyExists) return <Navigate to={`/home`} replace />

  const handleOpenConnectAppModal = () => handleOpen(MODAL_PARAMS_KEYS.CONNECT_APP)
  const handleOpenSettingsModal = () => handleOpen(MODAL_PARAMS_KEYS.SETTINGS)
  const handleOpenEditNameModal = () => handleOpen(MODAL_PARAMS_KEYS.EDIT_NAME)
  const handleLogout = () => {
    handleCloseSettingsModal()
    handleOpen(MODAL_PARAMS_KEYS.CONFIRM_LOGOUT)
  }

  return (
    <>
      <Stack gap={'1rem'} height={'100%'}>
        {!showWarning && (
          <BackgroundSigningWarning isEnabling={isEnabling} onEnableBackSigning={handleEnableBackground} />
        )}
        {showEmailWarning && (
          <EmailConfirmationWarning email={email} isLoading={isLoading} onResend={handleResendConfirmation} />
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

        <Apps />
      </Stack>

      <ModalConnectApp />
      <ModalSettings isSynced={isSynced} onLogout={handleLogout} />
      <ModalExplanation />
      <ModalConfirmConnect />
      <ModalConfirmEvent />
      <ModalEditName />
      <ModalSetPassword isPasswordSet={isPasswordSet} />
      <ModalRebind />
      <ModalConfirmLogout npub={npub} />
    </>
  )
}

export default KeyPage
