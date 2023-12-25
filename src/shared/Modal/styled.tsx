import {
	Dialog,
	DialogContent,
	DialogContentProps,
	DialogProps,
	DialogTitle,
	DialogTitleProps,
	styled,
} from '@mui/material'

export const StyledDialog = styled((props: DialogProps) => (
	<Dialog
		{...props}
		classes={{
			container: 'container',
			paper: 'paper',
		}}
		slotProps={{
			backdrop: {
				sx: {
					backdropFilter: 'blur(2px)',
				},
			},
		}}
		fullWidth
	/>
))(({ theme }) => ({
	'& .container': {
		alignItems: 'flex-end',
	},
	'& .paper': {
		margin: '0',
		width: '100%',
		borderTopLeftRadius: '2rem',
		borderTopRightRadius: '2rem',
		background: theme.palette.secondary.main,
	},
}))

export const StyledDialogTitle = styled((props: DialogTitleProps) => (
	<DialogTitle {...props} variant='h5' />
))(() => {
	return {
		textAlign: 'center',
		fontWeight: 600,
	}
})

export const StyledDialogContent = styled((props: DialogContentProps) => (
	<DialogContent {...props} />
))(() => {
	return {
		padding: '0 1rem 1rem',
	}
})
