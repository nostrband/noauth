import { ToggleButton, ToggleButtonProps, styled } from '@mui/material'

export const StyledToggleButton = styled((props: ToggleButtonProps) => (
	<ToggleButton classes={{ selected: 'selected' }} {...props} />
))(({ theme }) => ({
	'&:is(&, :hover, :active)': {
		background: theme.palette.backgroundSecondary.default,
	},
	color: theme.palette.text.primary,
	flex: '1 0 6.25rem',
	height: '100px',
	borderRadius: '1rem',
	border: `2px solid transparent !important`,
	'&.selected': {
		border: `2px solid ${theme.palette.text.primary} !important`,
	},
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'flex-start',
	justifyContent: 'flex-start',
	textTransform: 'initial',
	'& .description': {
		display: 'inline-block',
		textAlign: 'left',
		lineHeight: '15px',
		margin: '0.5rem 0 0.25rem',
	},
	'& .info': {
		fontSize: '10px',
		fontWeight: 500,
	},
}))
