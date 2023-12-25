import { AppBar, Typography, TypographyProps, styled } from '@mui/material'
import { Link } from 'react-router-dom'

export const StyledAppBar = styled(AppBar)(({ theme }) => {
	return {
		background: 'transparent',
		color: theme.palette.primary.main,
		boxShadow: 'none',
		borderBottom: '1.4px solid ' + theme.palette.primary.main,
		marginBottom: '1rem',
	}
})

export const StyledAppName = styled((props: TypographyProps) => (
	<Typography component={Link} to={'/'} flexGrow={1} {...props} />
))(() => ({
	'&:not(:hover)': {
		textDecoration: 'initial',
	},
	color: 'inherit',
	display: 'flex',
	alignItems: 'center',
	gap: '0.75rem',
	fontWeight: 600,
	fontSize: '1rem',
	lineHeight: '22.4px',
}))
