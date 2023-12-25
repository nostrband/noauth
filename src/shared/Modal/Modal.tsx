import { DialogProps, Slide } from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import { FC, forwardRef } from 'react'
import { StyledDialog, StyledDialogContent, StyledDialogTitle } from './styled'

type ModalProps = DialogProps

const Transition = forwardRef(function Transition(
	props: TransitionProps & {
		children: React.ReactElement
	},
	ref: React.Ref<unknown>,
) {
	return <Slide direction='up' ref={ref} {...props} />
})

export const Modal: FC<ModalProps> = ({ children, title, ...props }) => {
	return (
		<StyledDialog {...props} TransitionComponent={Transition}>
			{title && <StyledDialogTitle>{title}</StyledDialogTitle>}
			<StyledDialogContent>{children}</StyledDialogContent>
		</StyledDialog>
	)
}
