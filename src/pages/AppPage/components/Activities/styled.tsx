import styled from '@emotion/styled'
import { Box, BoxProps } from '@mui/material'

export const StyledActivityItem = styled((props: BoxProps) => (
	<Box {...props} />
))(() => ({
	display: 'flex',
	gap: '0.5rem',
	justifyContent: 'space-between',
	alignItems: 'center',
	padding: '0.25rem',
}))
