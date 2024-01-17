import { DbApp, DbPerm } from '@/modules/db'
import { AppLink } from '@/shared/AppLink/AppLink'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { Box, Stack, Typography } from '@mui/material'
import { FC } from 'react'
import { StyledEmptyAppsBox } from '../styled'
import { Button } from '@/shared/Button/Button'
import { call } from '@/utils/helpers'
import { swicCall } from '@/modules/swic'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'
import { ItemApp } from './ItemApp'

type AppsProps = {
	apps: DbApp[]
	perms: DbPerm[]
	npub: string
}

export const Apps: FC<AppsProps> = ({ apps = [], perms = [], npub = '' }) => {
	const notify = useEnqueueSnackbar()

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
			{/* <SectionTitle>Permissions:</SectionTitle> */}
			{/* {!perms.filter((p) => p.appNpub === a.appNpub).length && (
						<Typography textAlign={'center'}>
							No permissions
						</Typography>
					)}
					{perms
						.filter((p) => p.appNpub === a.appNpub)
						.map((p) => (
							<div key={p.id}>
								{p.perm}: {p.value}
								<button onClick={() => deletePerm(p.id)}>
									x
								</button>
							</div>
						))}
					<hr /> */}
		</Box>
	)
}
