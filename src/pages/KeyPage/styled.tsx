import { Input, InputProps } from '@/shared/Input/Input'
import { Box, Button, ButtonProps, styled } from '@mui/material'

type StyledIconButtonProps = ButtonProps & {
	bgcolor_variant?: 'primary' | 'secondary'
}

export const StyledIconButton = styled((props: StyledIconButtonProps) => (
	<Button {...props} />
))(({ bgcolor_variant = 'primary', theme }) => {
	const isPrimary = bgcolor_variant === 'primary'
	return {
		flex: '1',
		padding: '0.75rem',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'flex-start',
		gap: '0.5rem',
		borderRadius: '1rem',
		fontSize: '0.875rem',
		'&:is(:hover, :active, &)': {
			background: isPrimary
				? theme.palette.primary.main
				: theme.palette.secondary.main,
		},
		color: isPrimary
			? theme.palette.text.secondary
			: theme.palette.text.primary,
	}
})

export const StyledEmptyAppsBox = styled(Box)(({ theme }) => {
	return {
		minHeight: '186px',
		display: 'flex',
		flexDirection: 'column',
		background: theme.palette.secondary.main,
		borderRadius: '24px',
		padding: '1rem',
		'& > .message': {
			flex: '1',
			display: 'grid',
			placeItems: 'center',
			color: theme.palette.text.primary,
			opacity: '0.6',
		},
	}
})

export const StyledInput = styled(({ className, ...props }: InputProps) => {
	return (
		<Input
			{...props}
			className='input'
			containerProps={{
				className,
			}}
			fullWidth
		/>
	)
})(({ theme }) => ({
	'& > .input': {
		border: 'none',
		background: theme.palette.secondary.main,
		color: theme.palette.primary.main,
		'& .adornment': {
			color: theme.palette.primary.main,
		},
	},
}))