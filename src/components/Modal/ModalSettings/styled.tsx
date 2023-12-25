import { Button } from '@/shared/Button/Button'
import {
	Stack,
	StackProps,
	Typography,
	TypographyProps,
	styled,
} from '@mui/material'

export const StyledSettingContainer = styled((props: StackProps) => (
	<Stack {...props} gap={'1rem'} />
))(() => ({
	padding: '0.75rem',
	borderRadius: '1rem',
	background: '#000000',
	color: '#fff',
}))

export const StyledButton = styled(Button)(({ theme }) => {
	return {
		'&.button:is(:hover, :active, &)': {
			background: theme.palette.secondary.main,
			color: theme.palette.text.primary,
		},
	}
})

export const StyledSynchedText = styled((props: TypographyProps) => (
	<Typography variant='caption' {...props} />
))(({ theme }) => {
	return {
		color: theme.palette.success.main,
	}
})
