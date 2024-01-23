import { AppButtonProps, Button } from '@/shared/Button/Button'
import {
	ToggleButtonGroup,
	ToggleButtonGroupProps,
	styled,
} from '@mui/material'

export const StyledButton = styled((props: AppButtonProps) => (
	<Button {...props} />
))(() => ({
	borderRadius: '19px',
	fontWeight: 600,
	padding: '0.75rem 1rem',
	maxHeight: '41px',
}))

export const StyledToggleButtonsGroup = styled(
	(props: ToggleButtonGroupProps) => <ToggleButtonGroup {...props} />,
)(() => ({
	gap: '0.75rem',
	marginBottom: '1rem',
	justifyContent: 'space-between',
	'&.MuiToggleButtonGroup-root .MuiToggleButtonGroup-grouped:not(:first-of-type)':
		{
			margin: '0',
			border: 'initial',
		},
	'&.MuiToggleButtonGroup-root .MuiToggleButtonGroup-grouped': {
		border: 'initial',
		borderRadius: '1rem',
	},
}))