import { useAppSelector } from '../../store/hooks/redux'
import { useParams } from 'react-router-dom'
import { Stack } from '@mui/material'
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

const KeyPage = () => {
	const { npub = '' } = useParams<{ npub: string }>()
	const { keys, apps, pending, perms } = useAppSelector(
		(state) => state.content,
	)
	const isSynced = useLiveQuery(checkNpubSyncQuerier(npub), [npub], false)

	const { handleOpen } = useModalSearchParams()

	const { handleEnableBackground, showWarning, isEnabling } =
		useBackgroundSigning()

	const key = keys.find((k) => k.npub === npub)

	let username = ''
	if (key?.name) {
		if (key.name.includes('@')) username = key.name
		else username = `${key?.name}@${DOMAIN}`
	}

	const filteredApps = apps.filter((a) => a.npub === npub)
	const { prepareEventPendings } = useTriggerConfirmModal(
		npub,
		pending,
		perms,
	)

	const handleOpenConnectAppModal = () =>
		handleOpen(MODAL_PARAMS_KEYS.CONNECT_APP)

	const handleOpenSettingsModal = () => handleOpen(MODAL_PARAMS_KEYS.SETTINGS)

	return (
		<>
			<Stack gap={'1rem'} height={'100%'}>
				{showWarning && (
					<BackgroundSigningWarning
						isEnabling={isEnabling}
						onEnableBackSigning={handleEnableBackground}
					/>
				)}
				<UserValueSection
					title='Your login'
					value={username}
					copyValue={username}
					explanationType={EXPLANATION_MODAL_KEYS.NPUB}
				/>
				<UserValueSection
					title='Your NPUB'
					value={npub}
					copyValue={npub}
					explanationType={EXPLANATION_MODAL_KEYS.NPUB}
				/>

				<Stack direction={'row'} gap={'0.75rem'}>
					<StyledIconButton onClick={handleOpenConnectAppModal}>
						<ShareIcon />
						Connect app
					</StyledIconButton>

					<StyledIconButton
						bgcolor_variant='secondary'
						onClick={handleOpenSettingsModal}
						withBadge={!isSynced}
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
			<ModalConfirmEvent confirmEventReqs={prepareEventPendings} />
		</>
	)
}

export default KeyPage
