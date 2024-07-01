import { AppButtonProps, Button } from '@/shared/Button/Button'
import { Alert, AlertProps, styled } from '@mui/material'
import RefreshIcon from '@mui/icons-material/Refresh'

export const StyledAlert = styled((props: AlertProps) => (
  <Alert {...props} variant="outlined" severity="info" classes={{ message: 'message' }} />
))(() => {
  return {
    height: 'auto',
    marginTop: '0.5rem',
    alignItems: 'center',
    '& .message': {
      flex: 1,
      overflow: 'initial',
    },
    '& .content': {
      width: '100%',
      alignItems: 'center',
      gap: '1rem',
    },
    '& .title': {
      display: '-webkit-box',
      WebkitLineClamp: 3,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    '@media screen and (max-width: 320px)': {
      '& .title': {
        fontSize: '14px',
        WebkitLineClamp: 2,
      },
    },
  }
})

export const StyledReloadButton = styled((props: AppButtonProps) => <Button startIcon={<RefreshIcon />} {...props} />)(
  ({ theme }) => {
    const isDarkTheme = theme.palette.mode === 'dark'
    return {
      padding: '0.25rem 1rem',
      '&.button:is(:hover, :active, &)': {
        background: isDarkTheme ? '#b8e7fb' : '#014361',
      },
      '@media screen and (max-width: 320px)': {
        padding: '0.25rem 0.5rem',
      },
    }
  }
)
