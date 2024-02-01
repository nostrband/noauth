import {
	DialogContentText,
	DialogContentTextProps,
	styled,
} from '@mui/material'

export const StyledDialogContentText = styled(
	(props: DialogContentTextProps) => <DialogContentText {...props} />,
)(({ theme }) => ({
	color: theme.palette.primary.main,
}))
