import { useLiveQuery } from 'dexie-react-hooks'
import { DbHistory, db } from '@/modules/db'
import { useParams } from 'react-router'
import { useAppSelector } from '@/store/hooks/redux'
import { selectAppByAppNpub, selectPermsByNpubAndAppNpub } from '@/store'
import { Navigate } from 'react-router-dom'
import { formatTimestampDate } from '@/utils/helpers/date'
import { Avatar, Box, IconButton, Stack, Typography } from '@mui/material'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { getShortenNpub } from '@/utils/helpers/helpers'
import { StyledButton } from './styled'
import { PermissionsMenu } from './components/PermissionsMenu'
import { useOpenMenu } from '@/hooks/useOpenMenu'
import { ACTIONS } from '@/components/Modal/ModalConfirmEvent/ModalConfirmEvent'
import MoreIcon from '@mui/icons-material/MoreVert'

const getAppHistoryQuery = (appNpub: string) =>
	db.history.where('appNpub').equals(appNpub).toArray()

const AppPage = () => {
	const { appNpub = '', npub = '' } = useParams()
	const perms = useAppSelector((state) =>
		selectPermsByNpubAndAppNpub(state, npub, appNpub),
	)
	const currentApp = useAppSelector((state) =>
		selectAppByAppNpub(state, appNpub),
	)
	const history = useLiveQuery(
		() => {
			if (!appNpub.trim().length) return []
			return getAppHistoryQuery(appNpub)
		},
		[],
		[] as DbHistory[],
	)

	const { anchorEl, handleClose, handleOpen, open } = useOpenMenu()
	const connectPerm = perms.find((perm) => perm.perm === 'connect')

	if (!currentApp) {
		return <Navigate to={`/key/${npub}`} />
	}

	const { icon = '', name = '' } = currentApp || {}
	const appName = name || getShortenNpub(appNpub)
	const { timestamp } = connectPerm || {}
	const connectedOn =
		connectPerm && timestamp
			? `Connected at ${formatTimestampDate(timestamp)}`
			: 'Not connected'

	return (
		<Stack maxHeight={'100%'} overflow={'auto'}>
			<Stack
				marginBottom={'1rem'}
				direction={'row'}
				gap={'1rem'}
				width={'100%'}
			>
				<Avatar
					src={icon}
					sx={{
						width: 70,
						height: 70,
					}}
					variant='rounded'
				/>
				<Box flex={'1'} overflow={'hidden'}>
					<Typography variant='h4' noWrap>
						{appName}
					</Typography>
					<Typography variant='body2' noWrap>
						{connectedOn}
					</Typography>
				</Box>
			</Stack>

			<Box marginBottom={'1rem'}>
				<SectionTitle marginBottom={'0.5rem'}>Permissions</SectionTitle>
				<StyledButton onClick={handleOpen}>
					Basic/Advanced/Custom {perms.length}
				</StyledButton>
				<PermissionsMenu
					open={open}
					anchorEl={anchorEl}
					perms={perms}
					onClose={handleClose}
				/>
			</Box>

			<SectionTitle marginBottom={'0.5rem'}>Activity</SectionTitle>
			<Box
				flex={1}
				overflow={'auto'}
				display={'flex'}
				flexDirection={'column'}
				gap={'0.5rem'}
			>
				{history.map((h) => {
					return (
						<Stack>
							<Box
								width={'100%'}
								display={'flex'}
								gap={'0.5rem'}
								alignItems={'center'}
							>
								<Typography flex={1} fontWeight={700}>
									{ACTIONS[h.method] || h.method}
								</Typography>
								<Typography
									textTransform={'capitalize'}
									variant='body2'
								>
									{h.allowed ? 'allow' : 'disallow'}
								</Typography>
								<IconButton>
									<MoreIcon />
								</IconButton>
							</Box>
							<Typography variant='caption'>
								{formatTimestampDate(h.timestamp)}
							</Typography>
						</Stack>
					)
				})}
			</Box>
		</Stack>
	)
}

export default AppPage
