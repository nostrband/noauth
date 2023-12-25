import {
	styled,
	Button as MuiButton,
	ButtonProps as MuiButtonProps,
} from '@mui/material'
import { forwardRef } from 'react'

// const BUTTON_VARIANTS = {
// 	PRIMARY: 'primary',
// 	SECONDARY: 'secondary',
// 	TERTIARY: 'tertiary',
// }

type ButtonProps = MuiButtonProps

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	({ children, ...restProps }, ref) => {
		return (
			<StyledButton classes={{ root: 'button' }} {...restProps} ref={ref}>
				{children}
			</StyledButton>
		)
	},
)

const StyledButton = styled(
	forwardRef<HTMLButtonElement, MuiButtonProps>((props, ref) => (
		<MuiButton ref={ref} {...props} />
	)),
)(({ theme }) => {
	return {
		'&.button:is(:hover, :active, &)': {
			background: theme.palette.primary.main,
		},
		color: theme.palette.text.secondary,
		fontWeight: 500,
		borderRadius: '1rem',
	}
})
