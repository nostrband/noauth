import { IconButton, Typography } from '@mui/material'
import { forwardRef } from 'react'
import { useSnackbar } from 'notistack'
import CloseIcon from '@mui/icons-material/Close'
import { NotificationProps } from './types'
import { StyledAlert, StyledContainer } from './styled'

export const Notification = forwardRef<HTMLDivElement, NotificationProps>(({ message, alertvariant, id }, ref) => {
  const { closeSnackbar } = useSnackbar()

  const closeSnackBarHandler = () => closeSnackbar(id)

  return (
    <StyledAlert alertvariant={alertvariant} ref={ref}>
      <StyledContainer>
        <Typography variant="body1">{message}</Typography>
        <IconButton onClick={closeSnackBarHandler} color="inherit">
          <CloseIcon color="inherit" />
        </IconButton>
      </StyledContainer>
    </StyledAlert>
  )
})
