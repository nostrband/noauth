import { Button, ButtonProps, styled } from '@mui/material'
import GoBackIcon from '@mui/icons-material/KeyboardBackspaceRounded'

export const StyledButton = styled((props: ButtonProps) => (
	<Button
		{...props}
		startIcon={<GoBackIcon />}
		classes={{
			startIcon: 'icon',
		}}
	/>
))(() => ({
	marginBottom: '0.5rem',
	borderRadius: '8px',
	'&:is(:hover,:active)': {
		textDecoration: 'underline',
	},
	'& .icon': {
		marginRight: '5px',
	},
}))
