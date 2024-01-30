import { FC } from 'react'
import { Box, Typography } from '@mui/material'
import { DbPerm } from '@/modules/db'
import { ACTIONS } from '@/components/Modal/ModalConfirmEvent/ModalConfirmEvent'
import { StyledMenuItem } from './styled'
import { formatTimestampDate } from '@/utils/helpers/date'

type ItemPermissionMenuProps = {
	permission: DbPerm
}

export const ItemPermissionMenu: FC<ItemPermissionMenuProps> = ({
	permission,
}) => {
	const { perm, value, timestamp } = permission || {}

	return (
		<StyledMenuItem>
			<Box
				width={'100%'}
				display={'flex'}
				gap={'0.5rem'}
				alignItems={'center'}
			>
				<Typography flex={1} fontWeight={700}>
					{ACTIONS[perm] || perm}
				</Typography>
				<Typography textTransform={'capitalize'} variant='body2'>
					{value === '1' ? 'allow' : 'disallow'}
				</Typography>
			</Box>
			<Typography variant='body2'>
				{formatTimestampDate(timestamp)}
			</Typography>
		</StyledMenuItem>
	)
}
