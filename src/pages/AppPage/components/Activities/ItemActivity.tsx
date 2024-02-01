import React, { FC } from 'react'
import { DbHistory } from '@/modules/db'
import { Box, IconButton, Typography } from '@mui/material'
import { StyledActivityItem } from './styled'
import { formatTimestampDate } from '@/utils/helpers/date'
import ClearRoundedIcon from '@mui/icons-material/ClearRounded'
import DoneRoundedIcon from '@mui/icons-material/DoneRounded'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import { ACTIONS } from '@/utils/consts'

type ItemActivityProps = DbHistory

export const ItemActivity: FC<ItemActivityProps> = ({
	allowed,
	method,
	timestamp,
}) => {
	return (
		<StyledActivityItem>
			<Box
				display={'flex'}
				flexDirection={'column'}
				gap={'0.5rem'}
				flex={1}
			>
				<Typography flex={1} fontWeight={700}>
					{ACTIONS[method] || method}
				</Typography>
				<Typography variant='body2'>
					{formatTimestampDate(timestamp)}
				</Typography>
			</Box>
			<Box>
				{allowed ? (
					<DoneRoundedIcon htmlColor='green' />
				) : (
					<ClearRoundedIcon htmlColor='red' />
				)}
			</Box>
			<IconButton>
				<MoreVertRoundedIcon />
			</IconButton>
		</StyledActivityItem>
	)
}
