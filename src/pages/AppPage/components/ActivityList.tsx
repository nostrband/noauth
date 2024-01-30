import React, { FC } from 'react'
import { DbHistory } from '@/modules/db'
import { SectionTitle } from '@/shared/SectionTitle/SectionTitle'
import { Box, IconButton, Stack, Typography } from '@mui/material'
import MoreIcon from '@mui/icons-material/MoreVert'
import { ACTIONS } from '@/components/Modal/ModalConfirmEvent/ModalConfirmEvent'
import { formatTimestampDate } from '@/utils/helpers/date'
import { StyledButton } from './styled'

type ActivityListProps = {
	history: DbHistory[]
}

export const ActivityList: FC<ActivityListProps> = ({ history = [] }) => {
	return (
		<>
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
								<StyledButton>
									{h.allowed ? 'allow' : 'disallow'}
								</StyledButton>
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
		</>
	)
}
