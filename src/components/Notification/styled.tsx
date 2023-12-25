import { Alert, Box, styled } from '@mui/material'
import { StyledAlertProps } from './types'
import { BORDER_STYLES } from './const'
import { forwardRef } from 'react'

export const StyledAlert = styled(
	forwardRef<HTMLDivElement, StyledAlertProps>((props, ref) => (
		<Alert {...props} ref={ref} icon={false} />
	)),
)(({ alertvariant }) => ({
	width: '100%',
	maxHeight: 56,
	padding: '0.5rem 1rem',
	backgroundColor: '#FFF',
	borderRadius: 4,
	border: `solid ${BORDER_STYLES[alertvariant]} 1px`,
	color: BORDER_STYLES[alertvariant],
	fontSize: 12,
	fontWeight: '500',
	'& .MuiAlert-message': {
		display: 'flex',
		minWidth: '100%',
		justifyContent: 'space-between',
		overflow: 'hidden',
		padding: 0,
	},
}))

export const StyledContainer = styled(Box)(() => ({
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	gap: '1rem',
	width: '100%',
	'& > .MuiTypography-root': {
		flex: 1,
		width: '100%',
		wordBreak: 'break-word',
		display: '-webkit-box',
		WebkitLineClamp: 2,
		WebkitBoxOrient: 'vertical',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		fontWeight: 500,
	},
}))
