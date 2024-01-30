import { DbApp } from '@/modules/db'
import { AppLink } from '@/shared/AppLink/AppLink'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { Box, Stack, Typography } from '@mui/material'
import { FC } from 'react'
import { StyledEmptyAppsBox } from '../styled'
import { Button } from '@/shared/Button/Button'
import { call } from '@/utils/helpers/helpers'
import { swicCall } from '@/modules/swic'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { ItemApp } from './ItemApp'

type AppsProps = {
	apps: DbApp[]
	npub: string
}

export const Apps: FC<AppsProps> = ({ apps = [], npub = '' }) => {
	const notify = useEnqueueSnackbar()

	// eslint-disable-next-line
	async function deletePerm(id: string) {
		call(async () => {
			await swicCall('deletePerm', id)
			notify('Perm deleted!', 'success')
		})
	}

	return (
		<Box
			flex={1}
			marginBottom={'1rem'}
			display={'flex'}
			flexDirection={'column'}
			overflow={'auto'}
		>
			<Stack
				direction={'row'}
				alignItems={'center'}
				justifyContent={'space-between'}
				marginBottom={'0.5rem'}
			>
				<SectionTitle>Connected apps</SectionTitle>
				<AppLink title='Discover Apps' />
			</Stack>
			{!apps.length && (
				<StyledEmptyAppsBox>
					<Typography
						className='message'
						variant='h5'
						fontWeight={600}
						textAlign={'center'}
					>
						No connected apps
					</Typography>
					<Button>Discover Nostr Apps</Button>
				</StyledEmptyAppsBox>
			)}

			<Stack gap={'0.5rem'} overflow={'auto'} flex={1}>
				{apps.map((a) => (
					<ItemApp {...a} key={a.appNpub} />
				))}
			</Stack>
		</Box>
	)
}
