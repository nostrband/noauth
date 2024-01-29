import { MenuItem, MenuItemProps, styled } from '@mui/material'

export const StyledMenuItem = styled((props: MenuItemProps) => (
	<MenuItem {...props} />
))(({ theme }) => ({
	display: 'flex',
	flexDirection: 'column',
	alignItems: 'flex-start',
	gap: '0.5rem',
	'&:not(:first-of-type)': {
		borderTop: '1px solid ' + theme.palette.secondary.main,
	},
}))
