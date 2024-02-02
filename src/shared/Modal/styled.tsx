import {
	Box,
	BoxProps,
	Dialog,
	DialogContent,
	DialogContentProps,
	DialogProps,
	DialogTitle,
	DialogTitleProps,
	styled,
} from '@mui/material'

export const StyledDialog = styled(
	(props: DialogProps & { fixedHeight?: string }) => (
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
	),
)(({ theme, fixedHeight = '' }) => {
	const fixedHeightStyles = fixedHeight ? { height: fixedHeight } : {}
	return {
		'& .container': {
			alignItems: 'flex-end',
		},
		'& .paper': {
			margin: '0',
			width: '100%',
			borderTopLeftRadius: '2rem',
			borderTopRightRadius: '2rem',
			background:
				theme.palette.mode === 'light'
					? '#fff'
					: theme.palette.secondary.main,
			...fixedHeightStyles,
		},
	}
})

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
		display: 'flex',
		flexDirection: 'column',
	}
})

export const StyledCloseButtonWrapper = styled((props: BoxProps) => (
	<Box {...props} />
))(() => ({
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'flex-end',
	padding: '0.5rem 1rem',
	position: 'relative',
	'& > .close_btn': {
		position: 'absolute',
		transform: 'translateY(50%)',
	},
}))
