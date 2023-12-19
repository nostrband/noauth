import { styled, Button as MuiButton, ButtonProps } from '@mui/material'

const BUTTON_VARIANTS = {
	PRIMARY: 'primary',
	SECONDARY: 'secondary',
	TERTIARY: 'tertiary',
}

export const Button = () => {
	return <StyledButton>Button</StyledButton>
}

const StyledButton = styled((props: ButtonProps) => <MuiButton {...props} />)(
	() => {
		return {}
	},
)
