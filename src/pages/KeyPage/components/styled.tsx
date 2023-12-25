import { Input, InputProps } from '@/shared/Input/Input'
import { styled } from '@mui/material'

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
