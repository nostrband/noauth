import { DbKey } from '@/modules/db'
import { Stack } from '@mui/material'
import { FC } from 'react'
import { ListItemProfile } from './ListItemProfile'

type ListProfilesProps = {
	keys: DbKey[]
	onClickItem: (key: DbKey) => void
}

export const ListProfiles: FC<ListProfilesProps> = ({
	keys = [],
	onClickItem,
}) => {
	return (
		<Stack maxHeight={'10rem'} overflow={'auto'}>
			{keys.map((key) => {
				return (
					<ListItemProfile
						{...key}
						key={key.npub}
						onClickItem={() => onClickItem(key)}
					/>
				)
			})}
		</Stack>
	)
}
