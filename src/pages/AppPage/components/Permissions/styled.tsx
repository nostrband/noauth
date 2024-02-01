import { Box, BoxProps, styled } from '@mui/material'

export const StyledPermissionItem = styled((props: BoxProps) => (
	<Box {...props} />
))(() => ({
	display: 'flex',
	gap: '0.5rem',
	justifyContent: 'space-between',
	alignItems: 'center',
	padding: '0.5rem',
}))
