import { DialogProps, IconButton, Slide } from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import { FC, forwardRef } from 'react'
import {
	StyledCloseButtonWrapper,
	StyledDialog,
	StyledDialogContent,
	StyledDialogTitle,
} from './styled'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'

type ModalProps = DialogProps & {
	withCloseButton?: boolean
}

const Transition = forwardRef(function Transition(
	props: TransitionProps & {
		children: React.ReactElement
	},
	ref: React.Ref<unknown>,
) {
	return <Slide direction='up' ref={ref} {...props} />
})

export const Modal: FC<ModalProps> = ({
	children,
	title,
	onClose,
	withCloseButton = true,
	...props
}) => {
	return (
		<StyledDialog
			{...props}
			onClose={onClose}
			TransitionComponent={Transition}
		>
			{withCloseButton && (
				<StyledCloseButtonWrapper>
					<IconButton
						onClick={() => onClose && onClose({}, 'backdropClick')}
						className='close_btn'
					>
						<CloseRoundedIcon />
					</IconButton>
				</StyledCloseButtonWrapper>
			)}
			{title && <StyledDialogTitle>{title}</StyledDialogTitle>}
			<StyledDialogContent>{children}</StyledDialogContent>
		</StyledDialog>
	)
}
