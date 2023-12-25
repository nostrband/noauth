import { DbApp, DbPerm } from '@/modules/db'
import { AppLink } from '@/shared/AppLink/AppLink'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { Box, Stack, Typography } from '@mui/material'
import { FC } from 'react'
import { StyledEmptyAppsBox } from '../styled'
import { Button } from '@/shared/Button/Button'
import { Link } from 'react-router-dom'
import { call } from '@/utils/helpers'
import { swicCall } from '@/modules/swic'
import { useEnqueueSnackbar } from '@/hooks/useEnqueueSnackbar'

type AppsProps = {
	apps: DbApp[]
	perms: DbPerm[]
	npub: string
}

export const Apps: FC<AppsProps> = ({ apps = [], perms = [], npub = '' }) => {
	const notify = useEnqueueSnackbar()

	async function deletePerm(id: string) {
		call(async () => {
			await swicCall('deletePerm', id)
			notify('Perm deleted!', 'success')
		})
	}
	return (
		<Box>
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
			{apps.map((a) => (
				<div key={a.npub} style={{ marginTop: '10px' }}>
					<Typography
						component={Link}
						to={`/key/${npub}/app/${a.appNpub}`}
						noWrap
					>
						App: {a.appNpub}
					</Typography>
					<SectionTitle>Permissions:</SectionTitle>
					{!perms.filter((p) => p.appNpub === a.appNpub).length && (
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
					<hr />
				</div>
			))}
		</Box>
	)
}
