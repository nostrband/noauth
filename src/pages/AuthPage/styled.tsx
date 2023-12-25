import { AppLogo } from '@/assets'
import { Stack, styled, StackProps, Box } from '@mui/material'

export const StyledContent = styled((props: StackProps) => (
	<Stack {...props} gap={'1rem'} alignItems={'center'} />
))(({ theme }) => {
	return {
		background: theme.palette.secondary.main,
		position: 'absolute',
		bottom: '-1rem',
		left: '-1rem',
		width: 'calc(100% + 2rem)',
		height: '70%',
		borderTopLeftRadius: '2rem',
		borderTopRightRadius: '2rem',
		padding: '1rem',
		maxWidth: '50rem',
		margin: '0 auto',
	}
})

export const StyledAppLogo = styled((props) => (
	<Box {...props}>
		<AppLogo />
	</Box>
))({
	background: '#00000054',
	padding: '0.75rem',
	borderRadius: '16px',
	display: 'grid',
	placeItems: 'center',
})
