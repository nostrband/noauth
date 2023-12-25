import { FC, ReactNode } from 'react'
import {
	Box,
	BoxProps,
	FormHelperText,
	FormHelperTextProps,
	FormLabel,
	InputBase,
	InputBaseProps,
	styled,
} from '@mui/material'

export type InputProps = InputBaseProps & {
	helperText?: string | ReactNode
	helperTextProps?: FormHelperTextProps
	containerProps?: BoxProps
	label?: string
}

export const Input: FC<InputProps> = ({
	helperText,
	containerProps,
	helperTextProps,
	label,
	...props
}) => {
	return (
		<StyledInputContainer {...containerProps}>
			{label ? (
				<FormLabel className='label' htmlFor={props.id}>
					{label}
				</FormLabel>
			) : null}
			<InputBase className='input' {...props} />
			{helperText ? (
				<FormHelperText {...helperTextProps} className='helper_text'>
					{helperText}
				</FormHelperText>
			) : null}
		</StyledInputContainer>
	)
}

const StyledInputContainer = styled((props: BoxProps) => <Box {...props} />)(
	({ theme }) => {
		const isDark = theme.palette.mode === 'dark'
		return {
			width: '100%',
			'& > .input': {
				background: isDark ? '#000000A8' : '#000',
				color: theme.palette.common.white,
				padding: '0.75rem 1rem',
				borderRadius: '1rem',
				border: '0.3px solid #FFFFFF54',
				fontSize: '0.875rem',
				'& input::placeholder': {
					color: '#fff',
				},
			},
			'& > .helper_text': {
				margin: '0.5rem 1rem 0',
				color: theme.palette.text.primary,
			},
			'& > .label': {
				margin: '0 1rem 0.5rem',
				display: 'block',
				color: theme.palette.primary.main,
				fontSize: '0.875rem',
			},
		}
	},
)
