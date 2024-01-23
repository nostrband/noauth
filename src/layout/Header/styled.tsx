import { AppBar, Typography, TypographyProps, styled } from '@mui/material'
import { Link } from 'react-router-dom'

export const StyledAppBar = styled(AppBar)(({ theme }) => {
	return {
		color: theme.palette.primary.main,
		boxShadow: 'none',
		marginBottom: '1rem',
		background: theme.palette.background.default,
		zIndex: 1301,
		maxWidth: 'inherit',
		left: '50%',
		transform: 'translateX(-50%)',
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
	marginLeft: '0.5rem',
}))