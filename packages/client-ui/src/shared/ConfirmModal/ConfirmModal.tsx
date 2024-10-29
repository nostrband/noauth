import React, { FC } from 'react'
import { Dialog, DialogActions, DialogContent, DialogProps, DialogTitle, Slide } from '@mui/material'
import { Button } from '../Button/Button'
import { TransitionProps } from '@mui/material/transitions'
import { StyledDialogContentText } from './styled'

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />
})

type ConfirmModalProps = {
  onConfirm: () => void
  onCancel: () => void
  headingText: string
  description?: string
} & DialogProps

export const ConfirmModal: FC<ConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  onCancel,
  headingText = 'Confirm',
  description,
}) => {
  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={onClose}
      sx={{ zIndex: 1302 }}
      PaperProps={{
        sx: {
          borderRadius: '10px',
        },
      }}
    >
      <DialogTitle fontWeight={600} fontSize={'1.5rem'}>
        {headingText}
      </DialogTitle>
      <DialogContent>
        <StyledDialogContentText>{description}</StyledDialogContentText>
      </DialogContent>
      <DialogActions>
        <Button varianttype="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onConfirm}>Confirm</Button>
      </DialogActions>
    </Dialog>
  )
}
